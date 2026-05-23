import app from './app';
import pool from './config/database';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.connect();
    console.log('Connection Established');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error: unknown) { 
    console.error('Connection failure:', error);
    process.exit(1);
  }
};

startServer();