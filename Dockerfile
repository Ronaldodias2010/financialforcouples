# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json yarn.lock ./

# Instalar dependências (incluindo dev dependencies para o build)
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN yarn build

# Estágio de produção - usar nginx para servir arquivos estáticos
FROM nginx:alpine AS production

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar página de erro customizada
COPY public/503.html /usr/share/nginx/html/503.html

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]