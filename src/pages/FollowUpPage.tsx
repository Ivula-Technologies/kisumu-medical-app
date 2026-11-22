import type { Referral } from '../services/referralProtocol'
import type { Role } from '../services/roles'
import { followUpLists } from '../services/followUp'
import { Dot, Icon, KpiStrip, Panel } from '../components/ui'
import { toneOf } from '../utils/tone'

interface Props {
  role: Role
  referrals: Referral[]
  now: Date
  onOpen: (id: string) => void
}

export function FollowUpPage({ referrals, now, onOpen }: Props) {
  const lists = followUpLists(referrals, now)
  const total = lists.reduce((sum, l) => sum + l.items.length, 0)

  return (
    <>
      <KpiStrip
        label="Follow-up summary"
        items={[
          { label: 'Open follow-up tasks', value: total, note: 'Across all worklists' },
          { label: 'Missed appointments', value: lists[0].items.length + lists[1].items.length, note: `${lists[1].items.length} already traced` },
          { label: 'Reminders due', value: lists[2].items.length, note: 'Appointments in the next 48 hours' },
          { label: 'Feedback owed', value: lists[3].items.length, note: 'Seen, referrer not yet told' },
        ]}
      />
      <div className="grid grid-2">
        {lists.map((list) => (
          <Panel key={list.id} title={list.title} eyebrow={list.owner} aside={<span className="tag">{list.items.length}</span>} flush>
            <p className="list-why">{list.why}</p>
            {list.items.length ? (
              <ul className="rows">
                {list.items.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="row row-select" onClick={() => onOpen(r.id)}>
                      <Dot tone={r.urgency === 'Urgent' ? toneOf('urgent') : list.tone} />
                      <span className="row-main">
                        <span className="row-title">
                          {r.id} <span className="muted">· {r.client} · {r.settlement}</span>
                        </span>
                        <span className="row-meta">{list.detail(r)}</span>
                      </span>
                      <span className="row-side">
                        <Icon name="arrow" size={16} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Nothing here.</p>
            )}
          </Panel>
        ))}
      </div>
    </>
  )
}
