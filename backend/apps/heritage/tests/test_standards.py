"""International-standards endpoints: CIDOC-CRM JSON-LD + IIIF manifest."""
import pytest

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# CIDOC-CRM v7.2
# ---------------------------------------------------------------------------
def test_cidoc_crm_is_public_and_well_formed(api_client, resource_unesco):
    res = api_client.get(f"/api/v1/heritage/resources/{resource_unesco.id}/cidoc-crm/")
    assert res.status_code == 200
    assert res["Content-Type"].startswith("application/ld+json")
    body = res.json()
    assert body["@type"] == "crm:E22_Human-Made_Object"
    assert body["@context"]["crm"] == "http://www.cidoc-crm.org/cidoc-crm/"
    # bilingual appellations
    langs = {a["language"] for a in body["P1_is_identified_by"]}
    assert {"fr", "ar"} <= langs
    # time-span carries the Ottoman boundaries
    assert body["P4_has_time-span"]["P82a_begin_of_the_begin"] == "1515"
    # WKT location from the PostGIS point
    place = body["P53_has_former_or_current_location"]
    assert place["P168_place_is_defined_by"]["format"] == "application/wkt"


def test_cidoc_crm_archaeological_site_maps_to_e27(api_client, resource_national):
    resource_national.architectural_type = "archaeological_site"
    resource_national.save()
    res = api_client.get(f"/api/v1/heritage/resources/{resource_national.id}/cidoc-crm/")
    assert res.status_code == 200
    assert res.json()["@type"] == "crm:E27_Site"


# ---------------------------------------------------------------------------
# IIIF Presentation API 3.0
# ---------------------------------------------------------------------------
def test_iiif_manifest_published_is_public(api_client, project_published):
    res = api_client.get(f"/api/v1/heritage/projects/{project_published.id}/iiif/manifest/")
    assert res.status_code == 200
    assert res["Content-Type"].startswith("application/ld+json")
    body = res.json()
    assert body["type"] == "Manifest"
    assert body["@context"] == "http://iiif.io/api/presentation/3/context.json"
    assert "fr" in body["label"]
    assert isinstance(body["items"], list)


def test_iiif_manifest_draft_hidden_from_anonymous(api_client, project_draft):
    res = api_client.get(f"/api/v1/heritage/projects/{project_draft.id}/iiif/manifest/")
    assert res.status_code == 404
