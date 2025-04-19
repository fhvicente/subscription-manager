const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUser() {
  try {
    const user = await prisma.user.update({
      where: {
        email: "SEU_EMAIL_AQUI" // Substitua pelo email do usuário
      },
      data: {
        clerkId: "SEU_CLERK_ID_AQUI" // Substitua pelo ID do Clerk (começa com user_)
      }
    });
    
    console.log('Usuário atualizado:', user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUser(); 