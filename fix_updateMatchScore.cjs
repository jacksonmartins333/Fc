const fs = require('fs');
let code = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

const target = `  const updateMatchScore = (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => {
    let updatedMatch: Match | undefined;
    setState(s => {
      const matchIndex = s.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return s;
      const match = s.matches[matchIndex];
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        playerId: playerId || '',
        teamId,
        timestamp: Date.now(),
      } as const;
      updatedMatch = {
        ...match,
        events: [...match.events, newEvent],
        teamA: {
          ...match.teamA,
          score: match.teamA.score + (teamId === match.teamA.id && type === 'goal' ? 1 : 0)
        },
        teamB: {
          ...match.teamB,
          score: match.teamB.score + (teamId === match.teamB.id && type === 'goal' ? 1 : 0)
        }
      };
      const newMatches = [...s.matches];
      newMatches[matchIndex] = updatedMatch;
      return { ...s, matches: newMatches };
    });
    if (user && updatedMatch) saveMatch(user.uid, updatedMatch, false);
  };`;

const replacement = `  const updateMatchScore = (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => {
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;
    const match = state.matches[matchIndex];
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      playerId: playerId || '',
      teamId,
      timestamp: Date.now(),
    } as const;
    const updatedMatch: Match = {
      ...match,
      events: [...match.events, newEvent],
      teamA: {
        ...match.teamA,
        score: match.teamA.score + (teamId === match.teamA.id && type === 'goal' ? 1 : 0)
      },
      teamB: {
        ...match.teamB,
        score: match.teamB.score + (teamId === match.teamB.id && type === 'goal' ? 1 : 0)
      }
    };
    setState(s => ({
      ...s,
      matches: s.matches.map(m => m.id === matchId ? updatedMatch : m)
    }));
    if (user) saveMatch(user.uid, updatedMatch, false);
  };`;

fs.writeFileSync('src/store/AppContext.tsx', code.replace(target, replacement));
