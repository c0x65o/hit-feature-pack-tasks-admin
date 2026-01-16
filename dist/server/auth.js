function base64UrlDecode(input) {
    let s = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) {
        if (pad === 1) {
            throw new Error('Invalid base64url string!');
        }
        s += new Array(5 - pad).join('=');
    }
    // IMPORTANT: do not append `pad` (number) to the base64 string.
    // Use Buffer for Node/server runtime robustness.
    return Buffer.from(s, 'base64').toString('utf8');
}
/**
 * Extract user from JWT token in cookies or Authorization header
 */
export function extractUserFromRequest(request) {
    // Check for token in cookie first
    let token = request.cookies.get('hit_token')?.value;
    // Fall back to Authorization header
    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }
    if (!token)
        return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return null;
        }
        const email = payload.email ||
            payload.preferred_username ||
            payload.upn ||
            payload.unique_name ||
            '';
        // Normalize roles (string | list | undefined)
        const rolesRaw = payload.roles ?? payload.role ?? [];
        const roles = Array.isArray(rolesRaw)
            ? rolesRaw.map((r) => String(r)).map((r) => r.trim()).filter(Boolean)
            : typeof rolesRaw === 'string'
                ? [rolesRaw.trim()].filter(Boolean)
                : [];
        return {
            sub: payload.sub || email || '',
            email: email || '',
            roles: roles.length > 0 ? roles : undefined,
        };
    }
    catch (e) {
        // Invalid token format
        console.warn('[job-core] Failed to parse JWT token:', e);
        return null;
    }
}
//# sourceMappingURL=auth.js.map