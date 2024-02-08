import React from 'react';
import {useSelector} from 'react-redux';
import {AITutorState} from '@cdo/apps/aiTutor/redux/aiTutorRedux';
import ChatMessage from './chatMessage';
import UserChatMessageEditor from './userChatMessageEditor';
import style from './ai-tutor.module.scss';
import WarningModal from './warningModal';

/**
 * Renders the AI Tutor main chat workspace component.
 */
const ChatWorkspace: React.FunctionComponent = () => {
  const storedMessages = useSelector(
    (state: {aiTutor: AITutorState}) => state.aiTutor.chatMessages
  );
  const isWaitingForChatResponse = useSelector(
    (state: {aiTutor: AITutorState}) => state.aiTutor.isWaitingForChatResponse
  );
  const level = useSelector(
    (state: {aiTutor: AITutorState}) => state.aiTutor.level
  );
  const scriptId = useSelector(
    (state: {aiTutor: AITutorState}) => state.aiTutor.scriptId
  );

  const showWaitingAnimation = () => {
    if (isWaitingForChatResponse) {
      return (
        <img
          src="/blockly/media/aichat/typing-animation.gif"
          alt={'Waiting for response'}
          className={style.waitingForResponse}
        />
      );
    }
  };

  return (
    <div id="chat-workspace-area" className={style.chatWorkspace}>
      <WarningModal />
      <div id="chat-workspace-conversation" className={style.conversationArea}>
        {storedMessages.map(message => (
          <ChatMessage message={message} key={message.id} />
        ))}
        {showWaitingAnimation()}
      </div>
      <div id="chat-workspace-editor" className={style.userChatMessageEditor}>
        <UserChatMessageEditor
          levelId={level?.Id}
          isProjectBacked={isProjectBacked}
          scriptId={scriptId}
        />
      </div>
    </div>
  );
};

export default ChatWorkspace;
