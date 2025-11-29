/**
 * Helper function to get the other user's ID from a match row
 * @param match - The match row containing user_a_id and user_b_id
 * @param currentUserId - The ID of the currently logged-in user
 * @returns The ID of the other user (not the current user)
 */
export function getOtherUserId(
    match: { user_a_id: string; user_b_id: string },
    currentUserId: string
): string {
    if (match.user_a_id === currentUserId) {
        return match.user_b_id;
    }
    return match.user_a_id;
}

/**
 * Helper function to get the other user's profile from a match row with joined profiles
 * @param match - The match row with joined profile data
 * @param currentUserId - The ID of the currently logged-in user
 * @returns The profile of the other user (not the current user), or null if not found
 */
export function getOtherUserProfile<T extends { user_a_id: string; user_b_id: string; user_a?: any; user_b?: any }>(
    match: T,
    currentUserId: string
): any | null {
    // Safety check: ensure we never return the current user's profile
    if (match.user_a_id === currentUserId) {
        const otherProfile = match.user_b;
        // Double-check the profile ID doesn't match current user
        if (otherProfile && otherProfile.id !== currentUserId) {
            return otherProfile;
        }
        return null;
    }

    if (match.user_b_id === currentUserId) {
        const otherProfile = match.user_a;
        // Double-check the profile ID doesn't match current user
        if (otherProfile && otherProfile.id !== currentUserId) {
            return otherProfile;
        }
        return null;
    }

    // If current user is not in this match, return null
    return null;
}

/**
 * Normalizes two user IDs to ensure consistent ordering (smaller ID first)
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Object with user_a_id (smaller) and user_b_id (larger)
 */
export function normalizeUserIds(userId1: string, userId2: string): { user_a_id: string; user_b_id: string } {
    return userId1 < userId2
        ? { user_a_id: userId1, user_b_id: userId2 }
        : { user_a_id: userId2, user_b_id: userId1 };
}

