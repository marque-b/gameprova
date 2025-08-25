# Debug Guide for Gamification Application

## Overview

This application is a gamified study platform with real-time multiplayer functionality. The debug system provides comprehensive logging to help identify and resolve issues with timers, reveal stages, and game flow.

## Debug Configuration

### Environment Variables

Both frontend and backend have debug logging controlled by environment variables:

**Backend (.env):**

```
DEBUG_LOGS=true
```

**Frontend (.env):**

```
VITE_DEBUG_LOGS=true
```

## Debug Features Added

### 1. Backend Debug Logging

#### HTTP Routes (`backend/src/http.js`)

- Session creation requests
- Bank listing
- Session state requests
- Error handling

#### WebSocket Server (`backend/src/ws.js`)

- Socket connections/disconnections
- Session join attempts
- Game start/stop events
- Answer submissions
- Timer scheduling and execution
- Reveal stage management
- Question advancement

#### Session Store (`backend/src/sessions/sessionStore.js`)

- Session lifecycle (create, start, end)
- Player management
- Question ordering and advancement
- Answer processing and scoring
- Rule updates

### 2. Frontend Debug Logging

#### Game Store (`frontend/src/store/useGameStore.js`)

- Socket connection management
- Event handling (session updates, rankings, questions, reveals)
- Answer submissions
- Rule updates

#### Components

- **Timer**: Timer initialization, state changes, countdown progress
- **QuestionCard**: Render cycles, answer selection, reveal state
- **Game**: Game state, timer configuration, reveal handling
- **HostPanel**: Session creation, rule updates, game controls

### 3. Timer System Debugging

#### Issues Fixed:

1. **Timer not showing**: Added proper configuration in HostPanel
2. **Timer not working**: Enhanced timer component with debug logging
3. **Timer synchronization**: Added comprehensive backend timer management

#### Timer Configuration:

- Set `perQuestionTimeSec` in HostPanel to enable timer
- Timer shows countdown with color changes (blue → yellow → red)
- Timer pauses during reveal stage
- Debug logs show timer state changes

### 4. Reveal Stage Debugging

#### Issues Fixed:

1. **Reveal not working**: Implemented proper reveal state management
2. **Answer visibility**: Added correct answer display during reveal
3. **Stage transitions**: Proper handling of question → reveal → next

#### Reveal Configuration:

- Set `revealDelaySec` in HostPanel (default: 3 seconds)
- Reveal shows correct answer with visual feedback
- Players cannot answer during reveal stage
- Debug logs track reveal state changes

## Debug Output Examples

### Backend Logs

```
[DEBUG] [2024-01-15T10:30:00.000Z] [session:abc123] Creating new session: bank=arrais_amador, profile=custom
[DEBUG] [2024-01-15T10:30:01.000Z] [session:abc123] Player joined successfully: John (player456)
[DEBUG] [2024-01-15T10:30:02.000Z] [session:abc123] Starting session with profile: custom
[DEBUG] [2024-01-15T10:30:03.000Z] [session:abc123] Timer scheduled for question AA-239 with 30 seconds
```

### Frontend Logs

```
[DEBUG] [2024-01-15T10:30:00.000Z] [FRONTEND] Creating new socket connection to http://localhost:3001
[DEBUG] [2024-01-15T10:30:01.000Z] [GAME] Game render: {sessionId: "abc123", questionId: "AA-239", selected: null, revealState: null}
[DEBUG] [2024-01-15T10:30:02.000Z] [TIMER] Timer initialized: seconds=30, running=true
```

## Common Issues and Solutions

### 1. Timer Not Showing

**Problem**: Timer component doesn't appear
**Solution**:

- Check `perQuestionTimeSec` is set in HostPanel
- Verify `rules.perQuestionTimeSec` is a positive number
- Check debug logs for timer initialization

### 2. Timer Not Counting Down

**Problem**: Timer shows but doesn't count down
**Solution**:

- Check backend timer scheduling logs
- Verify WebSocket connection is active
- Check for timer conflicts in sync mode

### 3. Reveal Stage Not Working

**Problem**: Answers not revealed after timer/answers
**Solution**:

- Check `revealDelaySec` configuration
- Verify `question:reveal` events are being sent
- Check frontend reveal state management

### 4. Questions Not Advancing

**Problem**: Game stuck on same question
**Solution**:

- Check session profile (exam vs sync)
- Verify all players answered (sync mode)
- Check question order generation

## Testing the Debug System

### 1. Start Both Servers

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### 2. Create a Test Session

1. Go to HostPanel
2. Set `perQuestionTimeSec` to 30
3. Set `revealDelaySec` to 3
4. Create session
5. Check console for debug logs

### 3. Join as Player

1. Open join link in new tab
2. Enter nickname
3. Check console for connection logs

### 4. Start Game

1. Click "Iniciar jogo" in HostPanel
2. Watch timer countdown
3. Answer question
4. Wait for reveal stage
5. Check all debug logs

## Debug Console Features

### Frontend Debug Panel

When `VITE_DEBUG_LOGS=true`, the Game page shows a debug panel with:

- Current question ID
- Selected answer
- Reveal state
- Timer status
- Session status

### Backend Debug Output

Backend logs show detailed information about:

- Session lifecycle
- Player actions
- Timer management
- Question flow
- Error conditions

## Performance Considerations

Debug logging adds minimal overhead but can be disabled in production by setting environment variables to `false`.

## Troubleshooting

If debug logs are not appearing:

1. Check environment variables are set correctly
2. Restart both frontend and backend servers
3. Clear browser console
4. Check for JavaScript errors preventing debug code execution
