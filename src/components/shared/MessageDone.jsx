import React, { useState, useEffect, useRef } from 'react';
import '../../components/styles/MessageDone.css';
import { io } from 'socket.io-client';
import { CSSTransition } from 'react-transition-group';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const MessageDone = ({ conversationId, senderId, messages, setMessages, onNotify }) => {
  // State declarations
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  // For managing scrolling-related disabling of long press
  const [isScrolling, setIsScrolling] = useState(false);

  // Refs for managing context menu, socket connection, long press, scroll timeout and touch start coordinate
  const contextMenuRef = useRef(null);
  const socketRef = useRef(null);
  const touchTimeout = useRef(null);
  const scrollTimeout = useRef(null);
  const touchStartPosition = useRef({ x: 0, y: 0 });
  const longPressTriggered = useRef(false);

  // 1. Fetch conversation messages when conversationId changes.
  useEffect(() => {
    if (!conversationId) return;
    const fetchMessages = async () => {
      try {
        const response = await wrapperFetch(`${BASE_URL}/messages/fetch/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessages(data.messages || []);
        } else {
          onNotify && onNotify('Failed to fetch conversation messages', 'error');
        }
      } catch (error) {
        console.error('Error fetching conversation messages:', error);
        onNotify && onNotify('Error fetching conversation messages', 'error');
      }
    };
    fetchMessages();
  }, [conversationId, setMessages]);

  // 2. Setup Socket.IO: Join room and listen for live events.
  useEffect(() => {
    if (!conversationId) return;
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', `conversation_${conversationId}`);

    // Listen for new messages.
    socketRef.current.on('newMessage', (messageData) => {
      if (
        !messageData.conversation_id ||
        parseInt(messageData.conversation_id, 10) === parseInt(conversationId, 10)
      ) {
        setMessages((prev) => {
          const newId = messageData.message_id || messageData.id;
          if (prev.some((msg) => (msg.message_id || msg.id) === newId)) return prev;
          return [...prev, messageData];
        });
      }
      console.log('New message received:', messageData);
    });

    // Listen for edited messages.
    socketRef.current.on('messageEdited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg.message_id || msg.id;
          const updatedId = updatedMessage.message_id || updatedMessage.id;
          return msgId === updatedId ? updatedMessage : msg;
        })
      );
      console.log('Edited message received:', updatedMessage);
    });

    // Listen for read status updates.
    socketRef.current.on('messageRead', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg.message_id || msg.id;
          const updatedId = updatedMessage.message_id || updatedMessage.id;
          return msgId === updatedId ? updatedMessage : msg;
        })
      );
      console.log('Read status update received:', updatedMessage);
    });

    // Listen for message deletion.
    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((msg) => {
          const id = msg.message_id || msg.id;
          return id !== messageId;
        })
      );
      console.log('Message delete event received:', messageId);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, setMessages]);

  // 3. Automatically update read status for messages not sent by the current user.
  useEffect(() => {
    messages.forEach((msg) => {
      const id = msg.message_id || msg.id;
      const sender = msg.messages ? msg.messages.sender : msg.sender;
      const readStatus = msg.messages ? msg.messages.read_status : msg.read_status;
      if (sender !== senderId && !readStatus) {
        updateReadStatus(id);
      }
    });
  }, [messages, senderId]);

  // Utility: Trigger notifications.
  const notify = (message, type) => {
    if (onNotify) onNotify(message, type);
  };

  // 4. Close the context menu when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenu.visible &&
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
        setSelectedMessage(null);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [contextMenu.visible]);

  // 5. Auto-scroll to the latest message if enabled.
  useEffect(() => {
    const container = document.querySelector('.md-messages-container');
    if (container && autoScrollEnabled) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, autoScrollEnabled]);

  // 5a. Toggle auto-scroll based on user's scroll, and disable long press during scrolling.
  useEffect(() => {
    const container = document.querySelector('.md-messages-container');
    if (!container) return;
    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom > 50) {
        setAutoScrollEnabled(false);
      } else {
        setAutoScrollEnabled(true);
      }

      // Cancel any ongoing long press detection.
      cancelLongPress();
      // Mark as scrolling to prevent touch long press being registered.
      if (!isScrolling) setIsScrolling(true);
      // Reset long press ability only after 1.5 seconds of scroll inactivity.
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isScrolling]);

  // 6. Group messages by creation date.
  const groupMessagesByDate = (msgs) => {
    return msgs.reduce((acc, message) => {
      const createdAt = message.messages ? message.messages.created_at : message.created_at;
      const date = new Date(createdAt).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(message);
      return acc;
    }, {});
  };
  const groupedMessages = groupMessagesByDate(messages);

  // 7. Handle file selection.
  const handleFileUpload = (event) => {
    if (event.target.files.length > 0) {
      setImageFile(event.target.files[0]);
    }
  };

  // Remove image preview.
  const removeImagePreview = () => {
    setImageFile(null);
  };

  // 8. Send a new message.
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('sender_id', senderId);
    formData.append('message', newMessage);
    if (imageFile) formData.append('image', imageFile);
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/send`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => {
          const newId = data.messageData.id;
          if (prev.some((msg) => (msg.message_id || msg.id) === newId)) return prev;
          return [...prev, data.messageData];
        });
        setNewMessage('');
        setImageFile(null);
        notify('Message sent successfully!', 'success');
      } else {
        console.error('Failed to send message:', data.message);
        notify('Failed to send message.', 'error');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      notify('Error sending message.', 'error');
    }
  };

  // 9. Show the context menu with a given message.
  const handleMessageSelect = (event, msg) => {
    event.preventDefault();
    setSelectedMessage(msg);
    const normalized = {
      message_id: msg.message_id || msg.id,
      sender: msg.messages ? msg.messages.sender : msg.sender,
      message: msg.messages ? msg.messages.message : msg.message,
      image_url: msg.messages ? msg.messages.image_url : msg.image_url,
      read_status: msg.messages ? msg.messages.read_status : msg.read_status,
      is_edited: msg.messages ? msg.messages.is_edited : msg.is_edited,
    };
    const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
    const clientY = event.clientY || (event.touches ? event.touches[0].clientY : 0);
    setContextMenu({
      visible: true,
      x: clientX,
      y: clientY,
      message: normalized,
    });
  };

  // 10. Improved long press detection for touch devices.
  // Records the starting position and then triggers the context menu only if the touch remains within a small threshold.
  const startLongPress = (event, msg) => {
    // Do not begin long press if the scroll is active.
    if (isScrolling) return;
    longPressTriggered.current = false;
    const touch = event.touches[0];
    touchStartPosition.current = { x: touch.clientX, y: touch.clientY };
    touchTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {},
      };
      handleMessageSelect(fakeEvent, msg);
    }, 600); // 600ms threshold for long press
  };

  // Cancel the long press if the touch moves too far from the starting position.
  const moveLongPress = (event) => {
    if (!touchStartPosition.current.x || !touchStartPosition.current.y) return;
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosition.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosition.current.y);
    // If moved more than a threshold (e.g., 10px), cancel the pending long press.
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  // Cancel long press timeout.
  const cancelLongPress = () => {
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }
  };

  // Use the same function for touch end/cancel.
  const endLongPress = () => {
    cancelLongPress();
  };

  // 11. Update read status for a message.
  const updateReadStatus = async (messageId) => {
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      if (response.ok) {
        const updatedMessage = data.updatedMessage[0];
        setMessages((prev) =>
          prev.map((msg) => {
            const id = msg.message_id || msg.id;
            if (id === messageId) {
              return msg.messages
                ? { ...msg, messages: { ...msg.messages, read_status: updatedMessage.read_status } }
                : { ...msg, read_status: updatedMessage.read_status };
            }
            return msg;
          })
        );
      } else {
        console.error('Failed to update read status:', data.message);
      }
    } catch (err) {
      console.error('Error updating read status:', err);
    }
  };

  // 12. Save an edited message.
  const handleSaveEdit = async () => {
    const formData = new FormData();
    formData.append('messageId', editingMessage.message_id || editingMessage.id);
    formData.append('sender_id', senderId);
    formData.append('newMessage', editText);
    if (editImage) formData.append('image', editImage);
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/edit`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const updatedMsg = { message_id: data.updatedMessage.id, ...data.updatedMessage };
        updatedMsg.is_edited = true;
        setMessages((prev) =>
          prev.map((msg) =>
            (msg.message_id || msg.id) === (editingMessage.message_id || editingMessage.id)
              ? updatedMsg
              : msg
          )
        );
        if (socketRef.current) {
          socketRef.current.emit('messageEdited', updatedMsg);
        }
        setEditingMessage(null);
        setEditText('');
        setEditImage(null);
        notify('Message edited successfully!', 'success');
      } else {
        console.error('Failed to edit message:', data.message);
        notify('Failed to edit message.', 'error');
      }
    } catch (err) {
      console.error('Error editing message:', err);
      notify('Error editing message.', 'error');
    }
  };

  // 13. Delete a message.
  const handleDelete = async () => {
    const messageId = contextMenu.message.message_id || contextMenu.message.id;
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => (msg.message_id || msg.id) !== messageId));
        if (socketRef.current) {
          socketRef.current.emit('messageDeleted', { messageId });
        }
        notify('Message deleted successfully!', 'success');
      } else {
        console.error('Failed to delete message:', data.message);
        notify('Failed to delete message.', 'error');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      notify('Error deleting message.', 'error');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 14. Share a message.
  const handleShare = () => {
    const text = contextMenu.message.message;
    if (navigator.share) {
      navigator.share({
        title: 'Message',
        text,
        url: window.location.href,
      }).catch((err) => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(text);
      alert('Message copied to clipboard');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 15. Copy a message.
  const handleCopy = () => {
    const text = contextMenu.message.message;
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => console.log('Message copied to clipboard'))
        .catch((err) => console.error('Failed to copy:', err));
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  // 16. Download an image attachment.
  const handleDownload = async () => {
    const imageUrl = contextMenu.message.image_url;
    if (imageUrl) {
      try {
        const response = await wrapperFetch(imageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'downloaded_image';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Download failed:', err);
        notify('Download failed.', 'error');
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setSelectedMessage(null);
  };

  return (
    <div className="md-message-done">
      <div className="md-messages-header">
        <h2>Messaging</h2>
      </div>
      {/* Apply blur if a message is selected */}
      <div className={`md-messages-container${selectedMessage ? ' blur' : ''}`}>
        {Object.keys(groupedMessages).map((date) => (
          <div key={date}>
            <div className="md-date-divider">{date}</div>
            {groupedMessages[date].map((msg) => {
              const msgId = msg.message_id || msg.id;
              const selectedId = selectedMessage ? selectedMessage.message_id || selectedMessage.id : null;
              const isSelected = selectedId === msgId;
              const actualSender = msg.messages ? msg.messages.sender : msg.sender;
              const messageContent = msg.messages ? msg.messages.message : msg.message;
              const imageUrl = msg.messages ? msg.messages.image_url : msg.image_url;
              const isRead = msg.messages ? msg.messages.read_status : msg.read_status;
              const isEdited = msg.messages ? msg.messages.is_edited : msg.is_edited;
              return (
                <div
                  key={msgId}
                  className={`md-message-wrapper${actualSender === senderId ? ' md-sent' : ' md-received'}${
                    isSelected && !contextMenu.visible ? ' selected' : ''
                  }`}
                  onContextMenu={(e) => handleMessageSelect(e, msg)}
                  onTouchStart={(e) => startLongPress(e, msg)}
                  onTouchMove={moveLongPress}
                  onTouchEnd={endLongPress}
                  onTouchCancel={endLongPress}
                >
                  <div className={`md-message-bubble${actualSender === senderId ? ' md-sent' : ' md-received'}`}>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="MessageAttachment"
                        className="md-message-image"
                        onContextMenu={(e) => handleMessageSelect(e, msg)}
                        onTouchStart={(e) => startLongPress(e, msg)}
                        onTouchMove={moveLongPress}
                        onTouchEnd={endLongPress}
                        onTouchCancel={endLongPress}
                      />
                    )}
                    <p className="md-message-text">{messageContent}</p>
                  </div>
                  {actualSender === senderId ? (
                    <div className="md-read-status-container">
                      <span className="md-read-status">
                        {(isEdited ? '(edited)' : '') + (isRead ? 'Read' : 'Delivered')}
                      </span>
                    </div>
                  ) : (
                    isEdited && (
                      <div className="md-read-status-container">
                        <span className="md-edited-indicator">(edited)</span>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="md-message-input">
        <input
          type="text"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="md-input-field"
        />
        <input type="file" onChange={handleFileUpload} id="md-file-upload" style={{ display: 'none' }} />
        <label htmlFor="md-file-upload" className="md-upload-label">📎</label>
        {imageFile && (
          <div className="md-image-preview">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" />
            <button onClick={removeImagePreview}>×</button>
          </div>
        )}
        <button onClick={handleSendMessage} className="md-send-button">Send</button>
      </div>
      <CSSTransition
        in={contextMenu.visible}
        timeout={300}
        classNames="context-menu"
        unmountOnExit
        nodeRef={contextMenuRef}
      >
        <div className="md-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} ref={contextMenuRef}>
          {contextMenu.message?.sender === senderId && (
            <>
              <button
                onClick={() => {
                  setEditingMessage(contextMenu.message);
                  setEditText(contextMenu.message.message);
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  setSelectedMessage(null);
                }}
              >
                Edit
              </button>
              <button onClick={handleDelete}>Delete</button>
            </>
          )}
          <button onClick={handleCopy}>Copy</button>
          <button onClick={handleShare}>Share</button>
          {contextMenu.message?.image_url && <button onClick={handleDownload}>Download</button>}
        </div>
      </CSSTransition>
      {editingMessage && (
        <div className="md-edit-modal">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit message..."
          ></textarea>
          <input type="file" onChange={(e) => setEditImage(e.target.files[0])} />
          <button onClick={handleSaveEdit}>Save</button>
          <button
            onClick={() => {
              setEditingMessage(null);
              setSelectedMessage(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageDone;
