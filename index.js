let videoEl;
let billTotalPrice = 0;
let stream;

/* Desired configuration for the video stream. This configuration is used when 
requesting access to the user's camera using the `getUserMedia` method. 
More Info - https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia */
const videoConfig = {
  width: { ideal: 720 },
  height: { ideal: 480 },
  facingMode: "environment",
};

/* The `window.onload` event is triggered when the window has finished loading all its content,
including images, scripts, and stylesheets. Call `startMediaStream()` to start the media stream and 
capture video from the user's camera. */
window.onload = () => {
  startMediaStream();
};

const startMediaStream = async () => {
  /* Check if the `getUserMedia` method is available in the `navigator.mediaDevices` object 
  for browser compatibility purpose */
  if (!navigator?.mediaDevices?.getUserMedia) {
    return;
  }

  /* Request access to the user's camera using the `getUserMedia` method 
  provided by the `navigator.mediaDevices` object. */
  stream = await navigator.mediaDevices
    .getUserMedia({ video: videoConfig })
    .catch((err) => console.log({ err }));

  /* Select the first `<video>` element in the document using */
  videoEl = document.querySelector("video");

  if (!videoEl) {
    return;
  }

  /* Set the `srcObject` property to the `stream` object. 
  This connects the video stream from the user's camera to the video element,
  allowing the video to be displayed. */
  videoEl.srcObject = stream;
  videoEl.onloadedmetadata = () => {
    videoEl.play();

    /* Displays the camera icon for capturing the image */
    const imgEl = document.querySelector("img");
    imgEl.style.display = "block";
  };
};

/**
 * The `takePicture` function captures a still image from a video element, converts it to a data URL,
 * and then converts it to a Blob object before passing it to the `extractTextFromImageFile` function.
 */
const takePicture = () => {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  const context = canvasEl.getContext("2d");
  context.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
  const file = dataURItoBlob(canvasEl.toDataURL("image/png"));
  extractTextFromImageFile(file);
};

/**
 * The function extracts text from an image file and calculates the total bill price by searching for
 * lines containing the word "TOTAL" and removing non-numeric characters.
 * @param file - The `file` parameter is the image file from which you want to extract text. It should
 * be a valid image file, such as a JPEG or PNG file.
 */
const extractTextFromImageFile = async (file) => {
  /* More info on tesseract library - 
  1. https://github.com/tesseract-ocr/tesseract
  2. https://github.com/naptha/tesseract.js#tesseractjs
  */
  const worker = await Tesseract.createWorker("eng");
  const response = await worker.recognize(file);

  console.log(response.data); // Log the response just to check the result after extracting text from image file

  for (let lineText of response.data.lines) {
    if (lineText.text.match(/TOTAL/i)) {
      const amount = lineText.text.replace(/[\sa-zA-Z,$():]/gi, "");
      billTotalPrice += Number(amount);
    }
    updateBillTotalPrice();
  }

  await worker.terminate();
};

/**
 * The function `dataURItoBlob` converts a data URI (base64 encoded) to a Blob object.
 * @param dataURI - The `dataURI` parameter is a string that represents a data URI. A data URI is a URI
 * scheme that allows you to include data in-line in web pages as if they were external resources. It
 * consists of a scheme (e.g., "data"), a media type (e.g., "image/png")
 * @returns The function `dataURItoBlob` returns a Blob object.
 */
const dataURItoBlob = (dataURI) => {
  if (!dataURI) {
    return;
  }

  // convert base64 to raw binary data held in a string
  let byteString = atob(dataURI.split(",")[1]);

  // separate out the mime component
  let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to an ArrayBuffer
  let ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};

/**
 * The "reset" function sets the "billTotalPrice" variable to 0 and updates the bill total price in DOM.
 */
const reset = () => {
  billTotalPrice = 0;
  updateBillTotalPrice();
};

/**
 * The function updates the bill total price in DOM.
 */
const updateBillTotalPrice = () => {
  document.querySelector("span").textContent = billTotalPrice;
};

/* For rendering initial bill total price */
updateBillTotalPrice();
