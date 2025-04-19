import { get, run } from '../src/db/database.js';

async function updateUser() {
  try {
    const email = "SEU_EMAIL_AQUI"; // Substitua pelo email do usuário
    const clerkId = "SEU_CLERK_ID_AQUI"; // Substitua pelo ID do Clerk (começa com user_)
    
    // Update user with clerk ID
    const result = await run(
      'UPDATE users SET clerkId = ? WHERE email = ?',
      [clerkId, email]
    );
    
    if (result.changes > 0) {
      // Get updated user
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      console.log('Usuário atualizado:', user);
    } else {
      console.log('Usuário não encontrado ou nenhuma atualização foi feita');
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  }
}

updateUser(); 