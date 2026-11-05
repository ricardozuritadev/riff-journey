/** Stable UUIDs for idempotent seed data. */
export const SEED_IDS = {
  bandSum41: "11111111-1111-4111-8111-111111111111",
  albumAllKiller: "22222222-2222-4222-8222-222222222222",
  songNothingOnMyBack: "33333333-3333-4333-8333-333333333333",
  techniques: {
    "palm-muting": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    "alternate-picking": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    downpicking: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    "power-chords": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    slides: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    "hammer-ons": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
    "pull-offs": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
    bending: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
    vibrato: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9",
    "string-skipping": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10",
  },
} as const;

export const CURRENT_SEED_VERSION = 1;
