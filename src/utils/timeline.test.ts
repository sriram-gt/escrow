import { describe, expect, it } from 'vitest'
import { JobStatus } from '../types/escrow'
import { getTimelineModel } from './timeline'

describe('vertical workflow timeline model', () => {
  it('maps the normal lifecycle to one current stage at a time', () => {
    expect(getTimelineModel(JobStatus.OPEN)).toMatchObject({ completedThrough: 0, currentIndex: 0, disputeState: 'upcoming', refundState: 'upcoming' })
    expect(getTimelineModel(JobStatus.ACCEPTED)).toMatchObject({ completedThrough: 1, currentIndex: 1 })
    expect(getTimelineModel(JobStatus.FUNDED)).toMatchObject({ completedThrough: 2, currentIndex: 2 })
    expect(getTimelineModel(JobStatus.SUBMITTED)).toMatchObject({ completedThrough: 3, currentIndex: 3 })
    expect(getTimelineModel(JobStatus.RELEASED)).toMatchObject({ completedThrough: 4, currentIndex: 4 })
  })

  it('keeps dispute and refund as alternative outcomes', () => {
    expect(getTimelineModel(JobStatus.DISPUTED)).toMatchObject({ completedThrough: 3, currentIndex: null, disputeState: 'current', refundState: 'upcoming' })
    expect(getTimelineModel(JobStatus.REFUNDED)).toMatchObject({ completedThrough: 3, currentIndex: null, disputeState: 'complete', refundState: 'current' })
  })
})
