export default {
  dsn: process.env.SENTRY_DSN,
  // Eu deixei o de baixo comentado porque no ambiente de dev nao ta usando o dsn porque nao faz muito sentido receber um email toda vez... mas caso vc queira definir la vc pode tb... no caso acima ele esta sem nada nessa variavel
  // dsn: 'https://0c035bd03fee448383ee51bdefc06a2e@sentry.io/5173378',
};
