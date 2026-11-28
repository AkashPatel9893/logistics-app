/** Plain words for a support ticket's status. */
export function ticketStatusLabel(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'WAITING_CUSTOMER':
      return 'Waiting for your reply';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    default:
      return 'In progress';
  }
}

export function isTicketDone(status: string): boolean {
  return status === 'RESOLVED' || status === 'CLOSED';
}
