// Auction status mapping (Base44 §3). The DB enum `auction_status` predates the
// port as ('open','closed','won','cancelled'); Base44's spec talks in terms of
// live / closed / no_bids. We map onto the existing enum so no enum migration is
// needed, and centralise the vocabulary here.

export const AUCTION = {
  LIVE: "open", // accepting bids, countdown running
  WON: "won", // resolved, a contractor won
  NO_BIDS: "cancelled", // resolved, nobody bid
  CLOSED: "closed", // manually closed / cancelled by staff
} as const;

export type AuctionState = (typeof AUCTION)[keyof typeof AUCTION];

export function isAuctionLive(job: {
  auction_status?: string | null;
  auction_ends_at?: string | null;
}): boolean {
  return job.auction_status === AUCTION.LIVE;
}

export function auctionExpired(job: { auction_ends_at?: string | null }): boolean {
  if (!job.auction_ends_at) return false;
  return new Date(job.auction_ends_at).getTime() <= Date.now();
}
