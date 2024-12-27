// Função para remover valores `null`
export const cleanNulls = (data: Record<string, any>) => {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null));
};
