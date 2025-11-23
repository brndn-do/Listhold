import { getEventsByOrgId } from "./eventsService"


describe('getEventsByOrgId', () => {
  const mockOrgId = 'mock-org-id'
  it('should return all events that match organization ID', async () => {
    const result = await getEventsByOrgId(mockOrgId)
  })
})