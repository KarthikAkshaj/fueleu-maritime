import { app } from './app';

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`FuelEU backend listening on http://localhost:${PORT}`);
});

export { app };
