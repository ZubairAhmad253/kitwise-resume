// The prebuilt browser bundle of mammoth has the same API as the Node package.
declare module 'mammoth/mammoth.browser.min.js' {
  import mammoth from 'mammoth';
  export default mammoth;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
