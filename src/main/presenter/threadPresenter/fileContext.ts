import { MessageFile } from '@shared/chat'

export const getFileContext = (files: MessageFile[]) => {
  return files.length > 0
    ? `

  <files>
    ${files
      .map(
        (file) => `<file>
      <name>${file.name}</name>
      <mimeType>${file.mimeType}</mimeType>
      <size>${file.metadata.fileSize}</size>
      <path>${file.path}</path>
      <content>${!file.mimeType.startsWith('image') ? file.content : ''}</content>
    </file>`
      )
      .join('\n')}
  </files>
  `
    : ''
}
