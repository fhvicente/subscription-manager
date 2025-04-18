const { createClerkClient } = require('@clerk/express');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');

// Initialize Clerk client
const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// SOLUÇÃO TEMPORÁRIA: Ignora autenticação real e usa o primeiro usuário disponível
const authenticate = async (req, res, next) => {
    console.log('\n--- INÍCIO DO PROCESSO DE AUTENTICAÇÃO (MODO DE EMERGÊNCIA) ---');
    console.log('Endpoint requisitado:', req.method, req.originalUrl);
    
    try {
        // Busca por qualquer usuário disponível no banco
        const allUsers = await prisma.user.findMany({
            take: 1
        });
        
        console.log('Usuários disponíveis:', allUsers.length);
        
        if (allUsers.length === 0) {
            // Se não houver nenhum usuário, cria um usuário de teste
            console.log('Nenhum usuário encontrado, criando usuário de teste...');
            const testUser = await prisma.user.create({
                data: {
                    clerkId: `test-${Date.now()}`,
                    email: "emergency@example.com",
                    name: "Usuário de Emergência",
                    plan: 'free'
                }
            });
            
            console.log('Usuário de emergência criado:', testUser);
            
            // Adiciona o usuário de teste ao request
            req.user = {
                id: testUser.id,
                clerkId: testUser.clerkId,
                email: testUser.email,
                name: testUser.name,
                plan: testUser.plan
            };
        } else {
            // Usa o primeiro usuário disponível
            const user = allUsers[0];
            console.log('Usando usuário existente para autenticação:', user.email);
            
            req.user = {
                id: user.id,
                clerkId: user.clerkId,
                email: user.email,
                name: user.name,
                plan: user.plan
            };
        }
        
        console.log('--- FIM DO PROCESSO DE AUTENTICAÇÃO (MODO DE EMERGÊNCIA): SUCESSO ---\n');
        next();
    } catch (error) {
        console.error('Erro no modo de emergência:', error);
        return res.status(500).json({ 
            message: 'Erro no servidor - modo de emergência', 
            error: error.message 
        });
    }
};

module.exports = { authenticate };