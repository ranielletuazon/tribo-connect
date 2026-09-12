export type PasswordStrength = {
    score: 0 | 1 | 2 | 3 | 4; // 0 = empty, 1 = weak, 4 = strong
    label: string;
    color: string;
};

export function getPasswordStrength(password: string): PasswordStrength {
    if (password.length === 0) {
        return { score: 0, label: "", color: "#C4BFB2" };
    }

    let criteriaMet = 0;
    if (password.length >= 8) criteriaMet++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) criteriaMet++;
    if (/\d/.test(password)) criteriaMet++;
    if (/[^A-Za-z0-9]/.test(password)) criteriaMet++;

    if (criteriaMet <= 1)
        return { score: 1, label: "Mahina", color: "#B23A2E" };
    if (criteriaMet === 2)
        return { score: 2, label: "Katamtaman", color: "#D9622E" };
    if (criteriaMet === 3)
        return { score: 3, label: "Mabuti", color: "#C9A227" };
    return { score: 4, label: "Malakas", color: "#2F8F5B" };
}
