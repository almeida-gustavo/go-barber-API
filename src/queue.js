import 'dotenv/config';
import Queue from './lib/Queue';

// Isso eh para que vc roda as filas separados da aplicacao.
// Criar um novo script no package json
Queue.processQueue();
