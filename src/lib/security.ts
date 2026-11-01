/**
 * Security & Sanitization Utilities for Grota F.C
 */

// SHA-256 Hash with salt for admin credentials
export async function hashAdminPin(pin: string, salt: string = 'grota_fc_salt_2026'): Promise<string> {
  const normalized = pin.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized + ':' + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize user-provided text (removes HTML tags, controls length, prevents injection)
export function sanitizeText(input: unknown, maxLength = 60): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove dangerous HTML brackets
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLength);
}

// Sanitize PIX keys or payment identifiers
export function sanitizePixKey(input: unknown, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Validate number in safe range
export function clampNumber(value: unknown, min: number, max: number, defaultValue: number): number {
  const num = Number(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
}

// Deep sanitize backup JSON to prevent Prototype Pollution (__proto__, constructor)
export function safeValidateBackup(jsonData: any): { valid: boolean; data?: any; error?: string } {
  try {
    const raw = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { valid: false, error: 'Formato de arquivo inválido. Deve ser um objeto JSON.' };
    }

    // Check for prototype pollution attempts
    const serialized = JSON.stringify(raw);
    if (serialized.includes('__proto__') || serialized.includes('constructor') || serialized.includes('prototype')) {
      return { valid: false, error: 'Arquivo bloqueado por segurança: chaves não autorizadas detectadas.' };
    }

    // Validate players
    if (!Array.isArray(raw.players)) {
      return { valid: false, error: 'Lista de jogadores não encontrada no backup.' };
    }

    const sanitizedPlayers = raw.players
      .filter((p: any) => p && typeof p === 'object' && typeof p.name === 'string')
      .map((p: any) => ({
        id: sanitizeText(p.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, 64),
        name: sanitizeText(p.name, 60),
        type: p.type === 'avulso' ? 'avulso' : 'mensalista',
        rating: clampNumber(p.rating, 1, 5, 3),
        paymentStatus: ['pago', 'pendente', 'atrasado'].includes(p.paymentStatus) ? p.paymentStatus : 'pendente',
        isGoalkeeper: Boolean(p.isGoalkeeper),
        isPresent: Boolean(p.isPresent),
        stats: {
          goals: clampNumber(p.stats?.goals, 0, 1000, 0),
          assists: clampNumber(p.stats?.assists, 0, 1000, 0),
          matchesWon: clampNumber(p.stats?.matchesWon, 0, 1000, 0),
          matchesPlayed: clampNumber(p.stats?.matchesPlayed, 0, 1000, 0),
          goalsConceded: clampNumber(p.stats?.goalsConceded, 0, 1000, 0),
        }
      }));

    return {
      valid: true,
      data: {
        players: sanitizedPlayers,
        maxPlayersPerTeam: clampNumber(raw.maxPlayersPerTeam, 2, 20, 5),
        numberOfTeams: clampNumber(raw.numberOfTeams, 2, 8, 2),
        matchDurationMinutes: clampNumber(raw.matchDurationMinutes, 3, 60, 10),
        pixKey: sanitizePixKey(raw.pixKey || '', 80),
      }
    };
  } catch (err) {
    return { valid: false, error: 'Erro ao processar arquivo JSON.' };
  }
}
