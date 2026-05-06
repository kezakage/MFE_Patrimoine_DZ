import { STATUS_LABEL, STATUS_CLASS } from '../data/projects.js'

export default function StatusBadge({ status }) {
  return <span className={`chip ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}
