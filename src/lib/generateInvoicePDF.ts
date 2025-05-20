import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Service, NotaFiscal, ServicoNF } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

// Importar pdfMake e pdfFonts diretamente
// @ts-ignore - Ignorando erros de tipagem do pdfMake
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore - Ignorando erros de tipagem do pdfFonts 
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configurar pdfMake com as fontes
// @ts-ignore - Ignorando erros de tipagem do pdfMake
if (pdfMake && pdfFonts) {
  // @ts-ignore - Ignorando erros de tipagem do pdfMake
  pdfMake.vfs = pdfFonts.pdfMake?.vfs || {};
}

// Função auxiliar para formatar moeda
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

/**
 * Método 1: Gera PDF usando Blob, é o mais confiável para download
 */
export async function generatePDFWithBlob(service: Service): Promise<boolean> {
  try {
    const blob = await generatePDFBlob(service);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-fiscal-${service.auth_code || Math.random().toString(36).substring(2, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Limpeza
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Erro no método Blob:', error);
    return false;
  }
}

/**
 * Método 2: Gera PDF usando importação dinâmica
 */
export async function generatePDFWithDynamicImport(service: Service): Promise<boolean> {
  try {
    // Configuração do documento
    const docDefinition = createDocDefinition(service);
    
    return new Promise<boolean>((resolve) => {
      try {
        // @ts-ignore - Ignorando erros de tipagem do pdfMake
        if (!pdfMake) {
          console.error('pdfMake não está definido');
          resolve(false);
          return;
        }
        
        // @ts-ignore - Ignorando erros de tipagem do pdfMake
        pdfMake.createPdf(docDefinition).download(`nota-fiscal-${service.auth_code || Math.random().toString(36).substring(2, 10)}.pdf`);
        resolve(true);
      } catch (innerError) {
        console.error('Erro no download dinâmico:', innerError);
        resolve(false);
      }
    });
  } catch (error) {
    console.error('Erro no método de importação dinâmica:', error);
    return false;
  }
}

/**
 * Função auxiliar para gerar um Blob do PDF
 */
export async function generatePDFBlob(service: Service): Promise<Blob> {
  // Configuração do documento
  const docDefinition = createDocDefinition(service);
  
  // Retorna uma Promise que resolve para um Blob
  return new Promise<Blob>((resolve, reject) => {
    try {
      // @ts-ignore - Ignorando erros de tipagem do pdfMake
      if (!pdfMake) {
        reject(new Error('pdfMake não está definido'));
        return;
      }
      
      // @ts-ignore - Ignorando erros de tipagem do pdfMake
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Função auxiliar para criar a definição do documento
 */
function createDocDefinition(service: Service): TDocumentDefinitions {
  // Criar um ID de documento para rastreabilidade
  const documentId = service.auth_code || `AC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Formatar a data do serviço de forma mais elegante
  const serviceDateFormatted = service.service_date
    ? format(new Date(service.service_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  // Definir cores para o tema do documento - versão minimalista e profissional
  const colors = {
    primary: '#1F2937',     // Cinza escuro para títulos e cabeçalho
    secondary: '#4B5563',   // Cinza médio 
    accent: '#6B7280',      // Cinza para elementos menos importantes
    text: '#111827',        // Cinza muito escuro para texto principal
    textLight: '#6B7280',   // Cinza médio para texto secundário
    bgLight: '#F9FAFB',     // Cinza muito claro para fundos
    bgMedium: '#F3F4F6',    // Cinza claro para cabeçalhos de tabelas
    borderColor: '#E5E7EB', // Cinza claro para bordas
  };
  
  // Determinar o texto e a cor do status com base no status do serviço
  let statusText = 'SERVIÇO CONCLUÍDO';
  let statusColor = colors.primary;
  
  if (service.status) {
    switch (service.status) {
      case 'orcamento':
        statusText = 'ORÇAMENTO';
        statusColor = '#3B82F6'; // Azul
        break;
      case 'pago':
        statusText = 'SERVIÇO PAGO';
        statusColor = '#10B981'; // Verde
        break;
      case 'nao_pago':
        statusText = 'AGUARDANDO PAGAMENTO';
        statusColor = '#EF4444'; // Vermelho
        break;
      default:
        // Manter valores padrão
        break;
    }
  }
  
  return {
    pageSize: 'A4',
    pageMargins: [40, 80, 40, 40] as [number, number, number, number],
    
    // Cabeçalho mais simples e profissional
    header: {
      margin: [40, 20, 40, 0] as [number, number, number, number],
      columns: [
        {
          text: 'AUTOFY',
          bold: true,
          fontSize: 16,
          color: colors.primary
        },
        {
          text: service.status === 'orcamento' ? 'ORÇAMENTO' : 'NOTA FISCAL',
          alignment: 'right',
          fontSize: 14,
          color: colors.primary
        }
      ]
    },
    
    // Rodapé com informações da empresa
    footer: {
      margin: [40, 0, 40, 0] as [number, number, number, number],
      columns: [
        {
          text: 'Autofy Ltda.',
          fontSize: 8,
          color: colors.textLight
        },
        {
          text: documentId,
          fontSize: 8,
          color: colors.textLight,
          alignment: 'right'
        }
      ]
    },
    
    // Conteúdo principal do documento
    content: [
      // Seção de detalhes da nota
      {
        columns: [
          {
            width: '60%',
            stack: [
              {
                text: service.status === 'orcamento' ? 'Orçamento de Serviço' : 'Nota Fiscal de Serviço',
                fontSize: 16,
                color: colors.primary,
                bold: true,
                margin: [0, 10, 0, 5] as [number, number, number, number]
              },
              {
                text: `Emitido em: ${serviceDateFormatted}`,
                fontSize: 10,
                color: colors.textLight,
                margin: [0, 0, 0, 10] as [number, number, number, number]
              }
            ]
          },
          {
            width: '40%',
            stack: [
              {
                qr: documentId,
                fit: 80,
                foreground: colors.primary,
                margin: [0, 10, 0, 10] as [number, number, number, number]
              }
            ],
            alignment: 'right'
          }
        ]
      },
      
      // Status do serviço
      {
        text: statusText,
        alignment: 'center',
        fontSize: 12,
        bold: true,
        color: statusColor,
        margin: [0, 10, 0, 20] as [number, number, number, number]
      },
      
      // Informações do cliente e veículo em tabelas lado a lado
      {
        columns: [
          // Coluna do cliente
          {
            width: '48%',
            stack: [
              {
                text: 'DADOS DO CLIENTE',
                bold: true,
                fontSize: 11,
                color: colors.primary,
                margin: [0, 0, 0, 5] as [number, number, number, number]
              },
              {
                table: {
                  headerRows: 0,
                  widths: ['*'],
                  body: [
                    [
                      {
                        stack: [
                          {
                            text: service.client_name,
                            fontSize: 10,
                            bold: true,
                            margin: [0, 5, 0, 5] as [number, number, number, number]
                          },
                          {
                            text: `Telefone: ${service.client_phone || 'Não informado'}`,
                            fontSize: 9,
                            margin: [0, 0, 0, 5] as [number, number, number, number]
                          }
                        ],
                        margin: [5, 0, 5, 0] as [number, number, number, number]
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: function() { return 0.5; },
                  vLineWidth: function() { return 0.5; },
                  hLineColor: function() { return colors.borderColor; },
                  vLineColor: function() { return colors.borderColor; }
                }
              }
            ],
            margin: [0, 0, 5, 0] as [number, number, number, number]
          },
          
          // Coluna do veículo
          {
            width: '48%',
            stack: [
              {
                text: 'DADOS DO VEÍCULO',
                bold: true,
                fontSize: 11,
                color: colors.primary,
                margin: [0, 0, 0, 5] as [number, number, number, number]
              },
              {
                table: {
                  headerRows: 0,
                  widths: ['*'],
                  body: [
                    [
                      {
                        stack: [
                          {
                            text: service.car_model,
                            fontSize: 10,
                            bold: true,
                            margin: [0, 5, 0, 5] as [number, number, number, number]
                          },
                          {
                            text: `Placa: ${service.car_plate?.toUpperCase() || ''}`,
                            fontSize: 9,
                            margin: [0, 0, 0, 5] as [number, number, number, number]
                          }
                        ],
                        margin: [5, 0, 5, 0] as [number, number, number, number]
                      }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: function() { return 0.5; },
                  vLineWidth: function() { return 0.5; },
                  hLineColor: function() { return colors.borderColor; },
                  vLineColor: function() { return colors.borderColor; }
                }
              }
            ],
            margin: [0, 0, 0, 0] as [number, number, number, number]
          }
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      
      // Detalhes do serviço
      {
        stack: [
          {
            text: 'DETALHES DO SERVIÇO',
            bold: true,
            fontSize: 11,
            color: colors.primary,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            table: {
              headerRows: 1,
              widths: ['8%', '*', '25%'],
              body: [
                [
                  { 
                    text: 'ITEM', 
                    fontSize: 9,
                    bold: true,
                    fillColor: colors.bgMedium,
                    color: colors.primary,
                    alignment: 'center',
                    margin: [0, 5, 0, 5] as [number, number, number, number]
                  },
                  { 
                    text: 'DESCRIÇÃO', 
                    fontSize: 9,
                    bold: true,
                    fillColor: colors.bgMedium,
                    color: colors.primary,
                    alignment: 'left',
                    margin: [0, 5, 0, 5] as [number, number, number, number]
                  },
                  { 
                    text: 'VALOR', 
                    fontSize: 9,
                    bold: true,
                    fillColor: colors.bgMedium,
                    color: colors.primary,
                    alignment: 'right',
                    margin: [0, 5, 0, 5] as [number, number, number, number]
                  }
                ],
                ...(service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0 && service.catalog_services
                  ? service.catalog_services.map((catalogService, index) => [
                      { 
                        text: (index + 1).toString(), 
                        alignment: 'center',
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      },
                      { 
                        text: catalogService.name, 
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      },
                      { 
                        text: formatCurrency(catalogService.value), 
                        alignment: 'right',
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      }
                    ])
                  : service.services && Array.isArray(service.services)
                  ? service.services.map((catalogService, index) => [
                      { 
                        text: (index + 1).toString(), 
                        alignment: 'center',
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      },
                      { 
                        text: catalogService.name, 
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      },
                      { 
                        text: formatCurrency(catalogService.value), 
                        alignment: 'right',
                        fontSize: 9,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      }
                    ])
                  : [
                      [ 
                        { 
                          text: '1', 
                          alignment: 'center',
                          fontSize: 9,
                          margin: [0, 5, 0, 5] as [number, number, number, number]
                        },
                        { 
                          text: service.service?.name || 'Serviço', 
                          fontSize: 9,
                          margin: [0, 5, 0, 5] as [number, number, number, number]
                        },
                        { 
                          text: formatCurrency(service.service_value), 
                          alignment: 'right',
                          fontSize: 9,
                          margin: [0, 5, 0, 5] as [number, number, number, number]
                        }
                      ]
                    ])
              ]
            },
            layout: {
              hLineWidth: function() { return 0.5; },
              vLineWidth: function() { return 0.5; },
              hLineColor: function() { return colors.borderColor; },
              vLineColor: function() { return colors.borderColor; },
            }
          },
          // Total
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                table: {
                  body: [
                    [
                      { 
                        text: 'TOTAL:', 
                        bold: true, 
                        alignment: 'right',
                        fontSize: 10,
                        color: colors.primary,
                        margin: [0, 5, 5, 5] as [number, number, number, number]
                      },
                      { 
                        text: formatCurrency(service.service_value), 
                        bold: true, 
                        alignment: 'right',
                        fontSize: 12,
                        color: colors.primary,
                        margin: [0, 5, 0, 5] as [number, number, number, number]
                      }
                    ]
                  ]
                },
                layout: 'noBorders',
                margin: [0, 10, 0, 0] as [number, number, number, number]
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      
      // Peças reparadas
      {
        stack: [
          {
            text: 'SERVIÇOS',
            bold: true,
            fontSize: 11,
            color: colors.primary,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          },
          {
            ul: service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0 && service.catalog_services
              ? service.catalog_services.map(catalogService => ({
                  text: catalogService.name,
                  fontSize: 9,
                  color: colors.text,
                  margin: [0, 2, 0, 2] as [number, number, number, number]
                }))
              : service.services && Array.isArray(service.services)
              ? service.services.map(catalogService => ({
                  text: catalogService.name,
                  fontSize: 9,
                  color: colors.text,
                  margin: [0, 2, 0, 2] as [number, number, number, number]
                }))
              : hasRepairedParts(service)
              ? (service as any).repaired_parts
              : [{ text: 'Nenhum serviço especificado', fontSize: 9, italics: true, color: colors.textLight }]
          }
        ],
        margin: [0, 0, 0, 30] as [number, number, number, number]
      },
      
      // Assinaturas
      {
        columns: [
          {
            width: '40%',
            stack: [
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: colors.borderColor }
                ]
              },
              {
                text: 'Autofy (Responsável)',
                alignment: 'center',
                fontSize: 8,
                color: colors.textLight,
                margin: [0, 5, 0, 0] as [number, number, number, number]
              }
            ],
            alignment: 'center'
          },
          { width: '20%', text: '' },
          {
            width: '40%',
            stack: [
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: colors.borderColor }
                ]
              },
              {
                text: 'Cliente',
                alignment: 'center',
                fontSize: 8,
                color: colors.textLight,
                margin: [0, 5, 0, 0] as [number, number, number, number]
              }
            ],
            alignment: 'center'
          }
        ],
        margin: [0, 20, 0, 0] as [number, number, number, number]
      },
      
      // Informações adicionais
      {
        text: 'INFORMAÇÕES ADICIONAIS',
        fontSize: 8,
        bold: true,
        color: colors.textLight,
        margin: [0, 30, 0, 5] as [number, number, number, number]
      },
      {
        text: 'Este documento é válido como comprovante de serviço. A garantia é de 90 dias para defeitos relacionados ao serviço prestado.',
        fontSize: 7,
        color: colors.textLight,
        margin: [0, 0, 0, 0] as [number, number, number, number]
      }
    ],
    
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.3
    },
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number],
        color: colors.primary
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
        color: colors.primary
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 15, 0, 5] as [number, number, number, number],
        color: colors.primary
      }
    }
  };
}

/**
 * Função auxiliar para criar elementos de observações condicionalmente
 */
function createObservationsContentIfNeeded(observacoes?: string): any[] {
  if (!observacoes) return [];
  
  return [
    {
      text: 'OBSERVAÇÕES',
      bold: true,
      fontSize: 11,
      margin: [0, 15, 0, 5] as [number, number, number, number],
      color: '#2563EB'
    },
    {
      style: 'tableExample',
      table: {
        widths: ['*'],
        body: [
          [{ text: observacoes, margin: [5, 5, 5, 5] as [number, number, number, number] }]
        ]
      },
      layout: {
        hLineWidth: function() { return 1; },
        vLineWidth: function() { return 1; },
        hLineColor: function() { return '#EAEAEA'; },
        vLineColor: function() { return '#EAEAEA'; },
      }
    }
  ];
}

// Função para gerar a nota fiscal em PDF
export const generateInvoicePDF = (notaFiscal: NotaFiscal): void => {
  const dateString = notaFiscal.data 
    ? format(new Date(notaFiscal.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) 
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  // Preparar tabela de serviços
  const servicosTable = notaFiscal.servicos.map((servico, index) => [
    { text: (index + 1).toString(), alignment: 'center' },
    { text: servico.descricaoServico, alignment: 'left' },
    { text: formatCurrency(servico.valor), alignment: 'right' }
  ]);

  // Definir cores e textos com base no status
  let statusColor = '#2563EB'; // Azul padrão
  let statusText = 'NOTA FISCAL DE SERVIÇO';
  let statusBadgeText = '';
  let statusBadgeColor = '';
  
  // Definir texto e cor do status
  if (notaFiscal.status) {
    switch (notaFiscal.status) {
      case 'orcamento':
        statusText = 'ORÇAMENTO DE SERVIÇO';
        statusColor = '#3B82F6'; // Azul
        statusBadgeText = 'ORÇAMENTO';
        statusBadgeColor = '#EFF6FF'; // Fundo azul claro
        break;
      case 'pago':
        statusText = 'NOTA FISCAL DE SERVIÇO';
        statusColor = '#10B981'; // Verde
        statusBadgeText = 'PAGO';
        statusBadgeColor = '#ECFDF5'; // Fundo verde claro
        break;
      case 'nao_pago':
        statusText = 'NOTA FISCAL DE SERVIÇO';
        statusColor = '#EF4444'; // Vermelho
        statusBadgeText = 'NÃO PAGO';
        statusBadgeColor = '#FEF2F2'; // Fundo vermelho claro
        break;
      default:
        // Manter valores padrão
        break;
    }
  }

  // Definição do documento
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    header: {
      columns: [
        {
          width: 30,
          text: '',
          margin: [40, 20, 0, 0]
        },
        {
          text: 'AUTOFY',
          alignment: 'center',
          margin: [0, 20, 0, 0],
          fontSize: 16,
          bold: true,
          color: '#2563EB'
        },
        { width: 30, text: '' }
      ]
    },
    
    content: [
      {
        text: statusText,
        alignment: 'center',
        fontSize: 14,
        bold: true,
        margin: [0, 20, 0, 10],
        color: statusColor
      },
      
      // Adicionar badge de status quando aplicável
      ...(statusBadgeText ? [
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                headerRows: 0,
                widths: ['auto'],
                body: [
                  [
                    {
                      text: statusBadgeText,
                      alignment: 'center',
                      bold: true,
                      fontSize: 10,
                      color: statusColor,
                      fillColor: statusBadgeColor,
                      margin: [15, 5, 15, 5]
                    }
                  ]
                ]
              },
              margin: [0, 0, 0, 15],
              layout: {
                hLineWidth: function() { return 0; },
                vLineWidth: function() { return 0; },
                hLineColor: function() { return statusColor; },
                vLineColor: function() { return statusColor; },
              }
            },
            { width: '*', text: '' }
          ]
        }
      ] : []),
      
      {
        columns: [
          {
            width: '50%',
            text: [
              { text: 'Nº do Pedido: ', bold: true },
              { text: notaFiscal.numeroPedido || notaFiscal.codigoAutenticacao }
            ]
          },
          {
            width: '50%',
            text: [
              { text: 'Data: ', bold: true },
              { text: dateString }
            ],
            alignment: 'right'
          }
        ],
        margin: [0, 0, 0, 15]
      },
      {
        text: 'DADOS DO CLIENTE',
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5],
        color: '#2563EB'
      },
      {
        style: 'tableExample',
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: [{ text: 'Nome: ', bold: true }, notaFiscal.cliente.nome] },
                  { text: [{ text: 'Telefone: ', bold: true }, notaFiscal.cliente.telefone || 'Não informado'] }
                ],
                margin: [5, 5, 5, 5]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function() { return 1; },
          vLineWidth: function() { return 1; },
          hLineColor: function() { return '#EAEAEA'; },
          vLineColor: function() { return '#EAEAEA'; },
        }
      },
      {
        text: 'DADOS DO VEÍCULO',
        bold: true,
        fontSize: 11,
        margin: [0, 15, 0, 5],
        color: '#2563EB'
      },
      {
        style: 'tableExample',
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: [{ text: 'Modelo: ', bold: true }, notaFiscal.veiculo.modelo] },
                  { text: [{ text: 'Placa: ', bold: true }, notaFiscal.veiculo.placa] }
                ],
                margin: [5, 5, 5, 5]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: function() { return 1; },
          vLineWidth: function() { return 1; },
          hLineColor: function() { return '#EAEAEA'; },
          vLineColor: function() { return '#EAEAEA'; },
        }
      },
      {
        text: 'SERVIÇOS REALIZADOS',
        bold: true,
        fontSize: 11,
        margin: [0, 15, 0, 5],
        color: '#2563EB'
      },
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: ['8%', '*', '25%'],
          body: [
            [
              { text: 'Item', style: 'tableHeader', alignment: 'center' },
              { text: 'Descrição', style: 'tableHeader', alignment: 'center' },
              { text: 'Valor', style: 'tableHeader', alignment: 'center' }
            ],
            ...servicosTable
          ]
        },
        layout: {
          hLineWidth: function() { return 1; },
          vLineWidth: function() { return 1; },
          hLineColor: function() { return '#EAEAEA'; },
          vLineColor: function() { return '#EAEAEA'; },
          fillColor: function(i) { return (i === 0) ? '#F3F4F6' : null; }
        }
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                [
                  { text: 'TOTAL:', bold: true, alignment: 'right', margin: [0, 5, 0, 0] },
                  { 
                    text: formatCurrency(notaFiscal.valorTotal), 
                    bold: true, 
                    alignment: 'right',
                    fontSize: 12,
                    color: '#2563EB',
                    margin: [5, 5, 0, 0] 
                  }
                ]
              ]
            },
            layout: 'noBorders',
            margin: [0, 10, 0, 0]
          }
        ]
      },
      
      // Adicionar observações condicionalmente
      ...createObservationsContentIfNeeded(notaFiscal.observacoes),
    ],
    
    footer: {
      columns: [
        {
          text: 'Código de Autenticação: ' + notaFiscal.codigoAutenticacao,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 10, 0, 10]
        }
      ]
    },
    
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#1F2937'
      },
      tableExample: {
        margin: [0, 5, 0, 10]
      }
    },
    
    defaultStyle: {
      fontSize: 10,
      lineHeight: 1.3
    }
  };
  
  // Gerar e baixar o PDF
  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  pdfDocGenerator.download(`nota-fiscal-${notaFiscal.codigoAutenticacao}.pdf`);
  
  // Caso o download falhe, também podemos tentar abrir em nova guia
  // pdfDocGenerator.open({}, window);
  
  // Método alternativo usando Blob (descomente se necessário)
  /*
  pdfDocGenerator.getBuffer((buffer) => {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota-fiscal-${notaFiscal.codigoAutenticacao}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  */
};

// Converte um serviço para o formato de nota fiscal
export const serviceToNotaFiscal = (service: any): NotaFiscal => {
  // Construir os serviços a partir dos dados disponíveis
  let servicos: ServicoNF[] = [];
  
  console.log('Convertendo serviço para nota fiscal:', {
    selected_services: service.selected_services,
    catalog_services: service.catalog_services,
    services: service.services,
    service_id: service.service_id,
    service: service.service
  });
  
  // Verificar se existe o array de serviços selecionados E catalog_services
  if (service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0) {
    // Verifica se o service tem o objeto catalog_services (resultado de JOIN ou carregado separadamente)
    if (service.catalog_services && Array.isArray(service.catalog_services) && service.catalog_services.length > 0) {
      // Caso onde temos os serviços do catálogo já inclusos no resultado da query ou carregado separadamente
      console.log('Usando catalog_services para a nota fiscal:', service.catalog_services);
      servicos = service.catalog_services.map((catalogService: any) => ({
        descricaoServico: catalogService.name,
        valor: catalogService.value
      }));
    } else if (service.services && Array.isArray(service.services) && service.services.length > 0) {
      // Caso alternativo onde temos os serviços em um array chamado services
      console.log('Usando services para a nota fiscal:', service.services);
      servicos = service.services.map((catalogService: any) => ({
        descricaoServico: catalogService.name,
        valor: catalogService.value
      }));
    } else if (service.service?.name) {
      // Fallback para o serviço único
      console.log('Usando service único para a nota fiscal:', service.service);
      servicos.push({
        descricaoServico: service.service.name,
        valor: service.service_value
      });
    } else {
      // Fallback: adicionar apenas um serviço com o valor total
      console.log('Fallback: Nenhum detalhe de serviço disponível, usando valor total');
      servicos.push({
        descricaoServico: "Serviço selecionado",
        valor: service.service_value
      });
    }
  } else if (service.service?.name) {
    // Caso onde temos apenas um serviço do catálogo (formato antigo)
    console.log('Usando serviço único do formato antigo:', service.service);
    servicos.push({
      descricaoServico: service.service.name,
      valor: service.service_value
    });
  } else if (hasRepairedParts(service)) {
    // Formato ainda mais antigo: cada peça reparada é um serviço
    // Distribuir o valor total entre as peças reparadas
    console.log('Usando peças reparadas como serviços:', service.repaired_parts);
    const valorPorPeca = service.service_value / Math.max(service.repaired_parts.length, 1);
    
    servicos = service.repaired_parts.map((parte: string) => ({
      descricaoServico: parte.charAt(0).toUpperCase() + parte.slice(1),
      valor: valorPorPeca
    }));
  } else {
    // Fallback para caso nenhum serviço esteja definido
    console.log('Nenhum serviço encontrado, usando fallback');
    servicos.push({
      descricaoServico: "Serviço não especificado",
      valor: service.service_value
    });
  }

  console.log('Serviços finais para a nota fiscal:', servicos);

  return {
    cliente: {
      nome: service.client_name,
      telefone: service.client_phone || 'Não informado'
    },
    veiculo: {
      modelo: service.car_model,
      placa: service.car_plate?.toUpperCase() || ''
    },
    servicos,
    data: service.service_date,
    valorTotal: service.service_value,
    codigoAutenticacao: service.auth_code || generateAuthCode(),
    numeroPedido: service.id?.substring(0, 8).toUpperCase(),
    observacoes: service.observacoes,
    status: service.status || 'pago'
  };
};

/**
 * Método de fallback para download do PDF usando abordagem direta com Blob
 * Útil quando os outros métodos falham
 */
export async function generateAndDownloadPDF(service: Service): Promise<boolean> {
  try {
    // Tentar a abordagem mais confiável primeiro - Blob
    const success = await generatePDFWithBlob(service);
    if (success) {
      toast.success('PDF gerado e baixado com sucesso!');
      return true;
    }

    // Tentar a abordagem com importação dinâmica
    const successDynamic = await generatePDFWithDynamicImport(service);
    if (successDynamic) {
      toast.success('PDF gerado e baixado com sucesso!');
      return true;
    }

    // Se ambos falharem, usar o método padrão
    const blob = await generatePDFBlob(service);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-fiscal-${service.auth_code || Math.random().toString(36).substring(2, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('PDF gerado e baixado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    
    // Verificar se é erro específico de imagem
    if (error instanceof Error && 
        (error.message.includes('Invalid image') || 
         error.message.includes('Incomplete or corrupt PNG'))) {
      
      toast.error('Erro ao processar a imagem do cabeçalho. Tentando gerar PDF sem imagem...');
      
      // Tentar gerar sem imagem
      try {
        return await generatePDFWithoutImages(service);
      } catch (fallbackError) {
        console.error('Erro ao gerar PDF sem imagens:', fallbackError);
        toast.error('Não foi possível gerar o PDF. Por favor, tente novamente mais tarde.');
        return false;
      }
    }
    
    toast.error('Erro ao gerar o PDF. Por favor, tente novamente.');
    return false;
  }
}

// Função para gerar PDF sem usar imagens
async function generatePDFWithoutImages(service: Service): Promise<boolean> {
  try {
    // Criar docDefinition sem imagens
    const docDefinition = createSimpleDocDefinition(service);
    
    // Gerar e baixar o PDF
    return new Promise<boolean>((resolve) => {
      try {
        // @ts-ignore - Ignorando erros de tipagem do pdfMake
        if (!pdfMake) {
          console.error('pdfMake não está definido');
          resolve(false);
          return;
        }
        
        // @ts-ignore - Ignorando erros de tipagem do pdfMake
        pdfMake.createPdf(docDefinition).download(`nota-fiscal-${service.auth_code || Math.random().toString(36).substring(2, 10)}.pdf`);
        resolve(true);
      } catch (innerError) {
        console.error('Erro ao gerar PDF sem imagens:', innerError);
        resolve(false);
      }
    });
  } catch (error) {
    console.error('Erro no método sem imagens:', error);
    return false;
  }
}

// Gera um código de autenticação aleatório
const generateAuthCode = (): string => {
  return 'AC' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Cria uma definição de documento simplificada sem imagens
 */
function createSimpleDocDefinition(service: Service): TDocumentDefinitions {
  // Determinar o título com base no status
  let documentTitle = 'NOTA FISCAL DE SERVIÇO';
  let statusText = '';
  let statusColor = '#1F2937'; // Cor padrão cinza escuro
  
  if (service.status) {
    switch (service.status) {
      case 'orcamento':
        documentTitle = 'ORÇAMENTO DE SERVIÇO';
        statusText = '** ORÇAMENTO **';
        statusColor = '#3B82F6'; // Azul
        break;
      case 'pago':
        statusText = '** SERVIÇO PAGO **';
        statusColor = '#10B981'; // Verde
        break;
      case 'nao_pago':
        statusText = '** AGUARDANDO PAGAMENTO **';
        statusColor = '#EF4444'; // Vermelho
        break;
    }
  }
  
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    content: [
      { text: 'AUTOFY', style: 'header' },
      { text: documentTitle, style: 'subheader' },
      statusText ? { text: statusText, style: 'status', color: statusColor, alignment: 'center' as const, margin: [0, 5, 0, 15] } : { text: '' },
      { text: `Código de Autenticação: ${service.auth_code || 'N/A'}`, style: 'auth' },
      { text: `Data: ${service.service_date ? format(new Date(service.service_date), 'dd/MM/yyyy') : 'N/A'}`, margin: [0, 10, 0, 0] },
      { text: 'INFORMAÇÕES DO CLIENTE', style: 'sectionHeader', margin: [0, 15, 0, 5] },
      { text: `Nome: ${service.client_name}` },
      { text: `Telefone: ${service.client_phone || 'Não informado'}` },
      { text: `Placa do Veículo: ${service.car_plate}` },
      { text: `Modelo do Veículo: ${service.car_model}` },
      
      { text: 'DETALHES DO SERVIÇO', style: 'sectionHeader', margin: [0, 15, 0, 5] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Descrição', style: 'tableHeader' }, { text: 'Valor', style: 'tableHeader' }],
            ...(service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0 && service.catalog_services
              ? service.catalog_services.map(catalogService => [
                  catalogService.name,
                  { text: formatCurrency(catalogService.value), alignment: 'right' }
                ])
              : service.services && Array.isArray(service.services)
              ? service.services.map(catalogService => [
                  catalogService.name,
                  { text: formatCurrency(catalogService.value), alignment: 'right' }
                ])
              : [[service.service?.name || 'Serviço', { text: formatCurrency(service.service_value), alignment: 'right' }]])
          ]
        }
      },
      
      { text: 'SERVIÇOS', style: 'sectionHeader', margin: [0, 15, 0, 5] },
      {
        ul: service.selected_services && Array.isArray(service.selected_services) && service.selected_services.length > 0 && service.catalog_services
          ? service.catalog_services.map(catalogService => catalogService.name)
          : service.services && Array.isArray(service.services)
          ? service.services.map(catalogService => catalogService.name)
          : hasRepairedParts(service)
          ? (service as any).repaired_parts
          : ['Nenhum serviço especificado']
      },
      
      { text: 'TERMOS E CONDIÇÕES', style: 'sectionHeader', margin: [0, 15, 0, 5] },
      { text: 'A garantia deste serviço é válida por 90 dias a partir da data de emissão desta nota fiscal.' },
      { text: 'O pagamento deve ser realizado no ato da entrega do veículo.' },
      
      { text: 'ASSINATURAS', style: 'sectionHeader', margin: [0, 25, 0, 5] },
      {
        columns: [
          { text: '___________________________\nAssinatura do Cliente', alignment: 'center' },
          { text: '___________________________\nAssinatura do Responsável', alignment: 'center' }
        ]
      }
    ],
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        color: '#2563EB'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 5, 0, 10]
      },
      auth: {
        fontSize: 10,
        alignment: 'center',
        margin: [0, 5, 0, 15]
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#2563EB'
      },
      tableHeader: {
        bold: true,
        fillColor: '#f3f4f6'
      },
      status: {
        fontSize: 12,
        bold: true,
        color: '#2563EB'
      }
    }
  };
}

// Ajustar para lidar com service.repaired_parts mesmo quando a propriedade não existe no tipo
const hasRepairedParts = (service: any): boolean => {
  return service.repaired_parts && 
         Array.isArray(service.repaired_parts) && 
         service.repaired_parts.length > 0;
}; 