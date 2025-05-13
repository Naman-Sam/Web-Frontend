import React, { useState, useEffect, useRef } from 'react';
import '../../components/styles/MessageDone.css';
import { io } from 'socket.io-client';
import { wrapperFetch } from '../../utils/wrapperfetch';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

const SuperMessageDone = ({ conversationId, userId, messages, setMessages, onNotify }) => {
  // State declarations
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [editImage, setEditImage] = useState(null);

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

  // 2. Setup Socket.IO: join room and listen for live events.
  useEffect(() => {
    if (!conversationId) return;
    const socket = io(SOCKET_URL);
    socket.emit('joinRoom', `conversation_${conversationId}`);

    socket.on('newMessage', (messageData) => {
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

    socket.on('messageEdited', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = String(msg.message_id || msg.id);
          // Force conversion to string for consistency:
          const updatedId = String(updatedMessage.message_id || updatedMessage.id);
          return msgId === updatedId ? { ...msg, ...updatedMessage } : msg;
        })
      );
      console.log('Edited message received:', updatedMessage);
    });

    socket.on('messageRead', (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = msg.message_id || msg.id;
          const updatedId = updatedMessage.message_id || updatedMessage.id;
          return msgId === updatedId ? updatedMessage : msg;
        })
      );
      console.log('Read status update received:', updatedMessage);
    });

    socket.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((msg) => {
          const id = msg.message_id || msg.id;
          return id !== messageId;
        })
      );
      console.log('Message delete event received:', messageId);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversationId, setMessages]);

  // 3. Automatically update read status for messages not sent by the current user.
  useEffect(() => {
    messages.forEach((msg) => {
      const id = msg.message_id || msg.id;
      const sender = msg.messages ? msg.messages.sender : msg.sender;
      const readStatus = msg.messages ? msg.messages.read_status : msg.read_status;
      if (sender !== userId && !readStatus) {
        updateReadStatus(id);
      }
    });
  }, [messages, userId]);

  // Helper for notifications.
  const notify = (message, type) => {
    if (onNotify) onNotify(message, type);
  };

  // 4. Close context menu when clicking outside.
  const contextRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextRef.current && !contextRef.current.contains(event.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 5. Scroll to the latest message when messages update.
  useEffect(() => {
    const container = document.querySelector('.md-messages-container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

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

  // 7. Handle file selection for image upload.
  const handleFileUpload = (event) => {
    if (event.target.files.length > 0) {
      setImageFile(event.target.files[0]);
    }
  };

  // Remove image preview.
  const removeImagePreview = () => {
    setImageFile(null);
  };

  // 8. Send a new message via the superuser endpoint.
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('superuser_id', userId);
    formData.append('message', newMessage);
    if (imageFile) formData.append('image', imageFile);
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/superuser/send`, {
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
        notify('SuperUser message sent successfully!', 'success');
      } else {
        console.error('Failed to send message:', data.message);
        notify('Failed to send message.', 'error');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      notify('Error sending message.', 'error');
    }
  };

  // 9. Context menu handler.
  const handleContextMenu = (event, msg) => {
    const normalized = {
      message_id: msg.message_id,
      sender: msg.sender,
      message: msg.message,
      image_url: msg.image_url,
      read_status: msg.read_status,
      is_edited: msg.is_edited,
    };
    // Allow context menu only for messages sent by current user or if there's an image.
    if (normalized.sender !== userId && !normalized.image_url) return;
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, message: normalized });
  };

  // 10. Update read status for a message.
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

  // 11. Save an edited message. [UPDATED EDIT HANDLER]
  const handleSaveEdit = async () => {
    const formData = new FormData();
    // Convert messageId to string for consistent comparison.
    formData.append('messageId', String(editingMessage.message_id));
    formData.append('sender_id', userId);
    formData.append('newMessage', editText);
    if (editImage) formData.append('image', editImage);

    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/edit`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        // Assuming the server returns the updated message object under "updatedMessage"
        const updatedMsg = {
          ...data.updatedMessage,
          message_id: data.updatedMessage.id, // Normalize key naming
          is_edited: true,
        };
        setMessages((prev) =>
          prev.map((msg) => {
            const msgId = String(msg.message_id || msg.id);
            const updatedId = String(updatedMsg.message_id);
            return msgId === updatedId ? updatedMsg : msg;
          })
        );
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

  // 12. Delete a message.
  const handleDelete = async () => {
    const messageId = contextMenu.message.message_id;
    try {
      const response = await wrapperFetch(`${BASE_URL}/messages/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) =>
          prev.filter((msg) => {
            const id = msg.message_id || msg.id;
            return id !== messageId;
          })
        );
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
  };

  // 13. Share a message.
  const handleShare = () => {
    const text = contextMenu.message.message;
    if (navigator.share) {
      navigator
        .share({
          title: 'Message',
          text,
          url: window.location.href,
        })
        .catch((err) => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(text);
      alert('Message copied to clipboard');
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // 14. Download an image attachment.
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
  };

  return (
    <div className="md-message-done">
      <div className="md-messages-header">
        <h2>SuperUser Messaging</h2>
      </div>
      <div className="md-messages-container">
        {Object.keys(groupedMessages).map((date) => (
          <div key={date}>
            <div className="md-date-divider">{date}</div>
            {groupedMessages[date].map((msg) => {
              const actualSender = msg.messages ? msg.messages.sender : msg.sender;
              const messageContent = msg.messages ? msg.messages.message : msg.message;
              const imageUrl = msg.messages ? msg.messages.image_url : msg.image_url;
              const isRead = msg.messages ? msg.messages.read_status : msg.read_status;
              const isEdited = msg.messages ? msg.messages.is_edited : msg.is_edited;
              const id = msg.message_id || msg.id;
              return (
                <div
                  key={id}
                  className={`md-message-wrapper ${
                    actualSender === userId ? 'md-sent' : 'md-received'
                  }`}
                  onContextMenu={(e) =>
                    handleContextMenu(e, {
                      message_id: id,
                      sender: actualSender,
                      message: messageContent,
                      image_url: imageUrl,
                      read_status: isRead,
                      is_edited: isEdited,
                    })
                  }
                >
                  {/* Message bubble */}
                  <div
                    className={`md-message-bubble ${
                      actualSender === userId ? 'md-sent' : 'md-received'
                    }`}
                  >
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Message Attachment"
                        className="md-message-image"
                        onContextMenu={(e) =>
                          handleContextMenu(e, {
                            message_id: id,
                            sender: actualSender,
                            message: messageContent,
                            image_url: imageUrl,
                            read_status: isRead,
                            is_edited: isEdited,
                          })
                        }
                      />
                    )}
                    <p className="md-message-text">{messageContent}</p>
                  </div>
                  {/* Status indicator */}
                  {actualSender === userId ? (
                    <div className="md-status">
                      {isEdited && <span className="md-edited-indicator">(edited)</span>}
                      <span className="md-read-status">{isRead ? 'Read' : 'Delivered'}</span>
                    </div>
                  ) : (
                    isEdited && <div className="md-edited-indicator">(edited)</div>
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
        <input
          type="file"
          onChange={handleFileUpload}
          id="md-file-upload"
          style={{ display: 'none' }}
        />
        <label htmlFor="md-file-upload" className="md-upload-label">
          📎
        </label>
        {imageFile && (
          <div className="md-image-preview">
            <img src={URL.createObjectURL(imageFile)} alt="Preview" />
            <button onClick={removeImagePreview}>×</button>
          </div>
        )}
        <button onClick={handleSendMessage} className="md-send-button">
          Send
        </button>
      </div>
      {contextMenu.visible && (
        <div
          className="md-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          ref={contextRef}
        >
          {contextMenu.message?.sender === userId && (
            <>
              <button
                onClick={() => {
                  setEditingMessage(contextMenu.message);
                  setEditText(contextMenu.message.message);
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
              >
                Edit
              </button>
              <button onClick={handleDelete}>Delete</button>
            </>
          )}
          <button onClick={handleShare}>Share</button>
          {contextMenu.message?.image_url && (
            <button onClick={handleDownload}>Download</button>
          )}
        </div>
      )}
      {editingMessage && (
        <div className="md-edit-modal">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit message..."
          ></textarea>
          <input type="file" onChange={(e) => setEditImage(e.target.files[0])} />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={() => setEditingMessage(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default SuperMessageDone;
