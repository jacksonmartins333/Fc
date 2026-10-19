const fs = require('fs');
let code = fs.readFileSync('src/store/AppContext.tsx', 'utf8');

const target = `  const finishMatch = (matchId: string) => {
    let updatedMatch: Match | undefined;
    let modifiedPlayers: Player[] = [];
    
    setState(s => {
      const matchIndex = s.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return s;
      const match = s.matches[matchIndex];
      updatedMatch = { ...match, status: 'finished' as const };
      
      const newMatches = [...s.matches];
      newMatches[matchIndex] = updatedMatch;

      // Update player stats
      const newPlayers = [...s.players];
      
      const updateStatsForTeam = (team: Team, isWinner: boolean, goalsConceded: number) => {
        team.players.forEach(p => {
          const playerIdx = newPlayers.findIndex(np => np.id === p.id);
          if (playerIdx > -1) {
            const playerEvents = updatedMatch!.events.filter(e => e.playerId === p.id);
            const goals = playerEvents.filter(e => e.type === 'goal').length;
            const assists = playerEvents.filter(e => e.type === 'assist').length;
            
            newPlayers[playerIdx] = {
              ...newPlayers[playerIdx],
              stats: {
                ...newPlayers[playerIdx].stats,
                matchesPlayed: newPlayers[playerIdx].stats.matchesPlayed + 1,
                matchesWon: newPlayers[playerIdx].stats.matchesWon + (isWinner ? 1 : 0),
                goals: newPlayers[playerIdx].stats.goals + goals,
                assists: newPlayers[playerIdx].stats.assists + assists,
                goalsConceded: newPlayers[playerIdx].stats.goalsConceded + (p.isGoalkeeper ? goalsConceded : 0),
              }
            };
            modifiedPlayers.push(newPlayers[playerIdx]);
          }
        });
      };

      const teamAWon = match.teamA.score > match.teamB.score;
      const teamBWon = match.teamB.score > match.teamA.score;

      updateStatsForTeam(match.teamA, teamAWon, match.teamB.score);
      updateStatsForTeam(match.teamB, teamBWon, match.teamA.score);

      return { ...s, matches: newMatches, players: newPlayers };
    });
    
    if (user) {
      if (updatedMatch) saveMatch(user.uid, updatedMatch, false);
      modifiedPlayers.forEach(p => savePlayer(user.uid, p, false));
    }
  };`;

const replacement = `  const finishMatch = (matchId: string) => {
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;
    const match = state.matches[matchIndex];
    const updatedMatch: Match = { ...match, status: 'finished' as const };
    
    const newMatches = [...state.matches];
    newMatches[matchIndex] = updatedMatch;

    // Update player stats
    const newPlayers = [...state.players];
    const modifiedPlayers: Player[] = [];
    
    const updateStatsForTeam = (team: Team, isWinner: boolean, goalsConceded: number) => {
      team.players.forEach(p => {
        const playerIdx = newPlayers.findIndex(np => np.id === p.id);
        if (playerIdx > -1) {
          const playerEvents = updatedMatch.events.filter(e => e.playerId === p.id);
          const goals = playerEvents.filter(e => e.type === 'goal').length;
          const assists = playerEvents.filter(e => e.type === 'assist').length;
          
          newPlayers[playerIdx] = {
            ...newPlayers[playerIdx],
            stats: {
              ...newPlayers[playerIdx].stats,
              matchesPlayed: newPlayers[playerIdx].stats.matchesPlayed + 1,
              matchesWon: newPlayers[playerIdx].stats.matchesWon + (isWinner ? 1 : 0),
              goals: newPlayers[playerIdx].stats.goals + goals,
              assists: newPlayers[playerIdx].stats.assists + assists,
              goalsConceded: newPlayers[playerIdx].stats.goalsConceded + (p.isGoalkeeper ? goalsConceded : 0),
            }
          };
          modifiedPlayers.push(newPlayers[playerIdx]);
        }
      });
    };

    const teamAWon = match.teamA.score > match.teamB.score;
    const teamBWon = match.teamB.score > match.teamA.score;

    updateStatsForTeam(match.teamA, teamAWon, match.teamB.score);
    updateStatsForTeam(match.teamB, teamBWon, match.teamA.score);

    setState(s => ({ ...s, matches: newMatches, players: newPlayers }));
    
    if (user) {
      saveMatch(user.uid, updatedMatch, false);
      modifiedPlayers.forEach(p => savePlayer(user.uid, p, false));
    }
  };`;

fs.writeFileSync('src/store/AppContext.tsx', code.replace(target, replacement));
