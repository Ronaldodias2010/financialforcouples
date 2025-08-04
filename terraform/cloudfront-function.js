// Função CloudFront para manipular roteamento de Single Page Application (SPA)
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Verificar se a requisição é para um arquivo estático
    var staticFileExtensions = [
        '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
        '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.txt'
    ];
    
    var isStaticFile = staticFileExtensions.some(function(ext) {
        return uri.toLowerCase().endsWith(ext);
    });
    
    // Verificar se é uma requisição para a API ou health check
    var isApiRequest = uri.startsWith('/api/') || 
                      uri.startsWith('/health') || 
                      uri.startsWith('/favicon.ico');
    
    // Se for um arquivo estático ou requisição de API, retornar sem modificação
    if (isStaticFile || isApiRequest) {
        return request;
    }
    
    // Para todas as outras requisições (rotas da SPA), redirecionar para index.html
    if (!uri.endsWith('/') && !uri.includes('.')) {
        request.uri = '/index.html';
    } else if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    }
    
    return request;
}