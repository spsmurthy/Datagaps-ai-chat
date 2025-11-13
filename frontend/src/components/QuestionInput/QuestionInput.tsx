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

  const appStateContext = useContext(AppStateContext)
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      await convertToBase64(file);
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

    const questionTest: ChatMessage["content"] = base64Image ? [{ type: "text", text: question }, { type: "image_url", image_url: { url: base64Image } }] : question.toString();

    if (conversationId && questionTest !== undefined) {
      onSend(questionTest, conversationId)
      setBase64Image(null)
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
      const [base64Image, setBase64Image] = useState<string | null>(null)
      const [docPreview, setDocPreview] = useState<string | null>(null)
      const [docFilename, setDocFilename] = useState<string | null>(null)
      const [docUploadId, setDocUploadId] = useState<string | null>(null)

      const appStateContext = useContext(AppStateContext)
      const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

      const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
          // if image, convert to base64 for preview; otherwise upload document to backend for text extraction
          if (file.type && file.type.startsWith('image')) {
            await convertToBase64(file);
            setDocPreview(null);
            setDocFilename(null);
            setDocUploadId(null);
          } else {
            await uploadDocument(file as Blob & { name?: string });
          }
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

      const uploadDocument = async (file: Blob & { name?: string }) => {
        try {
          const formData = new FormData();
          // @ts-ignore
          formData.append('file', file, (file as any).name || 'upload');
          const resp = await fetch('/upload', {
            method: 'POST',
            body: formData
          });
          if (resp.ok) {
            const payload = await resp.json();
            setDocPreview(payload.text_preview || null);
            setDocFilename(payload.filename || (file as any).name || 'uploaded');
            setDocUploadId(payload.upload_id || null);
            setBase64Image(null);
          } else {
            console.error('Upload failed', resp.status);
          }
        } catch (err) {
          console.error('Upload error', err);
        }
      };

      const sendQuestion = () => {
        if (disabled || !question.trim()) {
          return
        }

        // If a document was uploaded, include its extracted text inline with the question (simple MVP approach)
        let questionTest: ChatMessage["content"];
        if (docPreview) {
          const docInfo = `\n\n[DOCUMENT: ${docFilename}]\n${docPreview}`;
          questionTest = `${question}\n\n${docInfo}`;
        } else if (base64Image) {
          questionTest = [{ type: "text", text: question }, { type: "image_url", image_url: { url: base64Image } }];
        } else {
          questionTest = question.toString();
        }

        if (conversationId && questionTest !== undefined) {
          onSend(questionTest, conversationId)
          setBase64Image(null)
          setDocPreview(null)
          setDocFilename(null)
          setDocUploadId(null)
        } else {
          onSend(questionTest)
          setBase64Image(null)
          setDocPreview(null)
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
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className={styles.fileInput}
              />
              <label htmlFor="fileInput" className={styles.fileLabel} aria-label='Upload File'>
                <FontIcon
                  className={styles.fileIcon}
                  iconName={'Attach'}
                  aria-label='Upload File'
                />
              </label>
            </div>)}
          {base64Image && <img className={styles.uploadedImage} src={base64Image} alt="Uploaded Preview" />}
          {docFilename && (
            <div className={styles.uploadedDocPreview}>
              <strong>Uploaded:</strong> {docFilename}
              {docPreview && <div className={styles.uploadedDocText}>{docPreview.substring(0, 500)}{docPreview.length > 500 ? '...' : ''}</div>}
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
