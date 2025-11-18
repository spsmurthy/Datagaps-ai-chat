import { useContext, useState } from 'react'
import { FontIcon, Stack, TextField } from '@fluentui/react'
import { SendRegular } from '@fluentui/react-icons'

import Send from '../../assets/Send.svg'

import styles from './QuestionInput.module.css'
import { ChatMessage } from '../../api'
import { AppStateContext } from '../../state/AppProvider'
import { resizeImage } from '../../utils/resizeImage'

interface Props {
  onSend: (question: ChatMessage['content'], id?: string) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docFullText, setDocFullText] = useState<string | null>(null);
  const [docFilename, setDocFilename] = useState<string | null>(null);
  const [docUploadId, setDocUploadId] = useState<string | null>(null);

  const appStateContext = useContext(AppStateContext)
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      console.log('File selected:', file.name, 'Type:', file.type);
      
      // Check if it's an image or document
      if (file.type.startsWith('image/')) {
        console.log('Processing as image');
        await convertToBase64(file);
      } else {
        console.log('Processing as document');
        // Handle document upload (PDF, DOCX, TXT)
        await uploadDocument(file);
      }
    }
  };

  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        console.log('Document size:', result.file_size, 'characters');
        
        if (result.extracted_text) {
          setDocFullText(result.extracted_text); // Store full text for sending
          setDocPreview(result.extracted_text.substring(0, 100) + '...'); // Just for display
          setDocFilename(result.filename);
          setDocUploadId(result.upload_id);
        } else {
          setDocFilename(result.filename);
          setDocUploadId(result.upload_id);
        }
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        alert(`Upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Error uploading document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertToBase64 = async (file: Blob) => {
    try {
      const resizedBase64 = await resizeImage(file, 800, 800);
      setBase64Image(resizedBase64);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sendQuestion = () => {
    if (disabled || !question.trim()) {
      return
    }

    let questionText = question;

    // If document is uploaded, append full extracted text to the question with proper context
    if (docFullText && docUploadId) {
      questionText = `${question}\n\n--- Document Content (${docFilename}) ---\n${docFullText}\n--- End of Document ---\n\nPlease analyze the above document and answer my question.`;
    }

    const questionTest: ChatMessage["content"] = base64Image ? [{ type: "text", text: questionText }, { type: "image_url", image_url: { url: base64Image } }] : questionText.toString();

    if (conversationId && questionTest !== undefined) {
      onSend(questionTest, conversationId)
      setBase64Image(null)
      setDocPreview(null)
      setDocFullText(null)
      setDocFilename(null)
      setDocUploadId(null)
    } else {
      onSend(questionTest)
      setBase64Image(null)
      setDocPreview(null)
      setDocFullText(null)
      setDocFilename(null)
      setDocUploadId(null)
    }

    if (clearOnSend) {
      setQuestion('')
    }
  }

  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
      ev.preventDefault()
      sendQuestion()
    }
  }

  const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setQuestion(newValue || '')
  }

  const sendQuestionDisabled = disabled || !question.trim()

  return (
    <Stack horizontal className={styles.questionInputContainer}>
      <TextField
        className={styles.questionInputTextArea}
        placeholder={placeholder}
        multiline
        resizable={false}
        borderless
        value={question}
        onChange={onQuestionChange}
        onKeyDown={onEnterPress}
      />
      {!OYD_ENABLED && (
        <div className={styles.fileInputContainer}>
          <input
            type="file"
            id="fileInput"
            onChange={(event) => handleImageUpload(event)}
            accept="image/*,.pdf,.docx,.doc,.txt,.md,.csv,.json,.log,.pptx,.ppt,.xlsx,.xls,.rtf"
            className={styles.fileInput}
          />
          <label htmlFor="fileInput" className={styles.fileLabel} aria-label='Upload Image or Document'>
            <FontIcon
              className={styles.fileIcon}
              iconName={'PhotoCollection'}
              aria-label='Upload Image or Document'
            />
          </label>
        </div>)}
      {base64Image && <img className={styles.uploadedImage} src={base64Image} alt="Uploaded Preview" />}
      {docFilename && (
        <div className={styles.attachmentBadge}>
          <FontIcon iconName="Attach" className={styles.attachmentIcon} />
          <span className={styles.attachmentName}>{docFilename}</span>
          <button 
            className={styles.removeAttachment} 
            onClick={() => {
              setDocFilename(null);
              setDocPreview(null);
              setDocFullText(null);
              setDocUploadId(null);
            }}
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}
      <div
        className={styles.questionInputSendButtonContainer}
        role="button"
        tabIndex={0}
        aria-label="Ask question button"
        onClick={sendQuestion}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? sendQuestion() : null)}>
        {sendQuestionDisabled ? (
          <SendRegular className={styles.questionInputSendButtonDisabled} />
        ) : (
          <img src={Send} className={styles.questionInputSendButton} alt="Send Button" />
        )}
      </div>
      <div className={styles.questionInputBottomBorder} />
    </Stack>
  )
}
