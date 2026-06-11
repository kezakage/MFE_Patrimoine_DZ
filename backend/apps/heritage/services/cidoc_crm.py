"""
CIDOC-CRM v7.2 mapping for heritage resources.

Produces a JSON-LD document that expresses a :class:`HeritageResource` as a
CIDOC Conceptual Reference Model entity, so the catalogue interoperates with
cultural-heritage information systems (Arches, ResearchSpace, …).

A monument is modelled as an ``E22_Human-Made_Object`` (an
``E27_Site`` for archaeological sites), identified by appellations
(``E41_Appellation``), typed (``E55_Type``), placed (``E53_Place``) and dated
(``E52_Time-Span``). The vocabulary URIs use the canonical CIDOC-CRM
namespace ``http://www.cidoc-crm.org/cidoc-crm/``.
"""
from __future__ import annotations

from apps.heritage.models import HeritageResource

CRM = "http://www.cidoc-crm.org/cidoc-crm/"

# Periods → approximate ISO-8601 spans, used to qualify the E52_Time-Span.
# Boundaries are indicative (heritage periods overlap); they let downstream
# tools place a resource on a timeline without hard-coding the vocabulary.
_PERIOD_SPANS: dict[str, tuple[str, str]] = {
    HeritageResource.Period.PREHISTORIC: ("-010000", "-0800"),
    HeritageResource.Period.NUMIDIAN: ("-0300", "-0046"),
    HeritageResource.Period.ROMAN: ("-0046", "0439"),
    HeritageResource.Period.MEDIEVAL: ("0700", "1500"),
    HeritageResource.Period.OTTOMAN: ("1515", "1830"),
    HeritageResource.Period.COLONIAL: ("1830", "1962"),
    HeritageResource.Period.CONTEMPORARY: ("1962", ""),
}

_BASE_URI = "https://patrimoinehub.dz/cidoc/resource/{id}"


def _uri(resource: HeritageResource, suffix: str = "") -> str:
    base = _BASE_URI.format(id=resource.pk)
    return f"{base}/{suffix}" if suffix else base


def resource_to_cidoc(resource: HeritageResource) -> dict:
    """Return a JSON-LD CIDOC-CRM representation of ``resource``."""
    is_site = (
        resource.architectural_type
        == HeritageResource.ArchitecturalType.ARCHAEOLOGICAL_SITE
    )
    main_class = "E27_Site" if is_site else "E22_Human-Made_Object"

    # --- E41_Appellation: bilingual names -------------------------------
    appellations = [{
        "@type": "E41_Appellation",
        "rdfs:label": resource.name_fr,
        "language": "fr",
    }]
    if resource.name_ar:
        appellations.append({
            "@type": "E41_Appellation",
            "rdfs:label": resource.name_ar,
            "language": "ar",
        })

    # --- E55_Type: architectural type + classification ------------------
    types = [
        {
            "@type": "E55_Type",
            "rdfs:label": str(resource.get_architectural_type_display()),
            "P2_has_type": f"architectural_type:{resource.architectural_type}",
        },
        {
            "@type": "E55_Type",
            "rdfs:label": str(resource.get_classification_level_display()),
            "P2_has_type": f"classification_level:{resource.classification_level}",
        },
    ]

    # --- E52_Time-Span: historical period -------------------------------
    begin, end = _PERIOD_SPANS.get(resource.period, ("", ""))
    time_span = {
        "@type": "E52_Time-Span",
        "rdfs:label": str(resource.get_period_display()),
    }
    if begin:
        time_span["P82a_begin_of_the_begin"] = begin
    if end:
        time_span["P82b_end_of_the_end"] = end

    # --- E53_Place: location + coordinates ------------------------------
    place: dict = {
        "@type": "E53_Place",
        "rdfs:label": ", ".join(p for p in (resource.commune, resource.wilaya) if p),
        "P89_falls_within": {
            "@type": "E53_Place",
            "rdfs:label": f"{resource.wilaya}, Algérie",
        },
    }
    if resource.geo_point is not None:
        lon, lat = resource.geo_point.x, resource.geo_point.y
        place["P168_place_is_defined_by"] = {
            "@type": "E94_Space_Primitive",
            "rdfs:label": f"POINT({lon} {lat})",
            "format": "application/wkt",
            "geo:lat": lat,
            "geo:long": lon,
        }

    doc: dict = {
        "@context": {
            "crm": CRM,
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
            "P1_is_identified_by": {"@id": f"{CRM}P1_is_identified_by"},
            "P2_has_type": {"@id": f"{CRM}P2_has_type"},
            "P3_has_note": {"@id": f"{CRM}P3_has_note"},
            "P4_has_time-span": {"@id": f"{CRM}P4_has_time-span"},
            "P53_has_former_or_current_location": {
                "@id": f"{CRM}P53_has_former_or_current_location"
            },
        },
        "@id": _uri(resource),
        "@type": f"crm:{main_class}",
        "rdfs:label": resource.name_fr,
        "P1_is_identified_by": appellations,
        "P2_has_type": types,
        "P4_has_time-span": time_span,
        "P53_has_former_or_current_location": place,
    }
    if resource.description:
        doc["P3_has_note"] = resource.description
    return doc
