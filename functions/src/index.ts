
import { onRequest } from 'firebase-functions/https';
import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import {onDocumentWritten} from "firebase-functions/v2/firestore";

// Only up to 10 instances at a time, rest are queued
setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});