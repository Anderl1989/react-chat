import { useEffect, useState } from "react";
import { Button, Chip, Divider, List, ListItem, ListItemText, ListSubheader, Paper, TextField, Typography } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import FaceOffIcon from '@mui/icons-material/FaceRetouchingOff';
import CloudOffIcon from '@mui/icons-material/CloudOff';

function Chat() {
  const [username, setUsername] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState('');
  const [addMessage, setAddMessage] = useState(null);
  const [messages, setMessages] = useState([]);

  // we have to use an efect to add a message to the messages array because of the way react works
  // the connect funciton is only executed when the connect button is clicked
  // and the "onmessage" event of the socket lives inside of it.
  // Thus the messages array inside of that would always have the value of when the button is clicked (empty)
  // The effect however is always updated when addMessage/messages changes (due to its dependencies), so the messages array is up to date.
  useEffect(() => {
    // check if there is a new message to be added
    if (addMessage) {
      // create new messages array with all old messages and the new one
      const newMessages = [...messages, addMessage];
      // clear the new message so it is not added again
      setAddMessage(null);
      // set the new messages array
      setMessages(newMessages);
    }
  }, [addMessage, messages])

  // function to connect to the ws
  const connect = () => {
    if (username.trim() !== '') {
      if (!socket) {
        // check if development or production use, handle port accordingly
        const port = window.location.port === '5173' ? 3000 : window.location.port;
        // connect to websocket
        const sock = new WebSocket(`ws://${window.location.hostname}:${port}/chat`);

        // event when socket is opened
        sock.onopen = () => {
          setMessages([]); // clear all existing messages (when reconnecting)
          setSocket(sock); // store socket so we can send messages later
          setLoggedIn(true); // set logged in state
          // send register message
          sock.send(JSON.stringify({
            type: 'register',
            author: username,
          }));
        };

        // event when a message is received
        sock.onmessage = (event) => {
          console.log(`Received Data ${event.data}`);
          const data = JSON.parse(event.data);
          // check if it is a participants list update or a regular message
          if (data.type === 'participants') {
            setParticipants(data.participants);
          } else {
            setAddMessage(data);
          }
        };

        // event when connection is lost/closed
        sock.onclose = (event) => {
          // if event code is 4000, it was closed by the server on purpose, show the reason to the user and log him out
          if (event.code === 4000) {
            setLoggedIn(false);
            setError(event.reason);
            setMessages([]);
          } else {
            // in every other case just display disconnected message
            setAddMessage({
              type: 'server-disconnected',
              time: Date.now(),
            });
          }
          // in any case, clear saved socket, as it cannot be used anymore
          setSocket(null);
        };

        // event when some error occurs, just forward it to the console.error function
        sock.onerror = console.error;
      }
    } else {
      // when no username was provided
      setError('Please enter a username.');
    }
  };

  // function to send new chat-message
  const sendMessage = () => {
    if (message.trim() !== '' && socket) {
      // send message to server
      socket.send(JSON.stringify({
        type: 'message',
        time: Date.now(),
        text: message,
      }));
      // clear input field
      setMessage('');
    }
  }

  return (
    <div style={{ padding: 10, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      {!loggedIn ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}>
            <TextField
              required
              variant="standard"
              label="Name"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError('');
              }}
              onKeyUp={(event) => {
                if (event.nativeEvent.key === 'Enter') {
                  connect();
                }
              }}
            />
            <Button
              onClick={connect}
            >Sign In</Button>
          </div>
          <Typography variant="caption" color="error.main">
            {error}
          </Typography>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <List
            sx={{ width: '300px', borderRight: '1px solid lightgrey' }}
            subheader={
              <ListSubheader>
                Participants
              </ListSubheader>
            }
          >
            { participants.map((name) => (
              <ListItem key={name}>
                <ListItemText primary={name} />
              </ListItem>
            )) }
          </List>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
            <div
              style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '0 10px' }}
              ref={(el) => {
                // always scroll to bottom when rerendering, so latest messages are visible
                if (el) {
                  el.scrollTo(0, el.scrollHeight);
                }
              }}
            >
              { messages.map((msg) => {
                const date = new Date(msg.time);
                const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
                const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
                const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
                const isOwn = msg.author === username;
                const timestamp = (styles = {}) => (
                  <Typography variant="caption" color="text.secondary" sx={{ margin: '0 3px', ...styles }}>
                    {`${hours}:${minutes}:${seconds}`}
                  </Typography>
                );
                if (msg.type === 'message') {
                  return (
                    <Paper
                      key={msg.time}
                      sx={{
                        flexGrow: 0,
                        flexShrink: 0,
                        margin: '20px 0 10px',
                        position: 'relative',
                        padding: '10px',
                        boxSizing: 'border-box',
                        width: '90%',
                        ...(isOwn ? { marginLeft: '10%' } : { marginRight: '10%' }),
                      }}
                      elevation={3}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: -20,
                          ...(isOwn ? { right: 0 } : { left: 0 }),
                        }}
                      >
                        {isOwn && timestamp()}
                        <Chip
                          label={msg.author}
                          size="small"
                          icon={<FaceIcon />}
                          sx={{
                            backgroundColor: 'white',
                          }}
                          variant={'outlined'}
                        />
                        {!isOwn && timestamp()}
                      </div>
                      <Typography variant="body2">
                        {msg.text}
                      </Typography>
                    </Paper>
                  );
                } else {
                  let icon = <FaceIcon />;
                  let message = `${msg.author} joined`;
                  if (msg.type === 'disconnected') {
                    icon = <FaceOffIcon />;
                    message = `${msg.author} left`;
                  } else if (msg.type === 'server-disconnected') {
                    icon = <CloudOffIcon />;
                    message = 'Disconnected from Server';
                  }
                  return (
                    <>
                      <div
                        style={{ position: 'relative', flexGrow: 0, flexShrink: 0, margin: '0 auto 10px' }}
                        key={msg.time}
                      >
                        <Chip
                          size="small"
                          icon={icon}
                          label={message}
                          variant={msg.type === 'connected' ? 'outlined' : undefined}
                        />
                        { timestamp({ position: 'absolute', left: '100%', top: 4 }) }
                      </div>
                      { msg.type === 'server-disconnected' && (
                        <Button onClick={connect}>Reconnect</Button>
                      )}
                    </>
                  );
                }
                
              })}
            </div>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', flexGrow: 0, flexShrink: 0, padding: '10px', boxSizing: 'border-box' }}>
              <TextField
                disabled={!socket}
                fullWidth
                variant="standard"
                label="Message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                }}
                onKeyUp={(event) => {
                  if (event.nativeEvent.key === 'Enter') {
                    sendMessage();
                  }
                }}
              />
              <Button
                disabled={!socket}
                onClick={sendMessage}
              >Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
