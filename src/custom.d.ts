// Este arquivo contém declarações de tipos personalizados para o TypeScript

/**
 * Extensão do módulo pdfmake
 */
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake: {
      vfs: any;
    };
  };
  export default pdfFonts;
}

/**
 * Para uso no generateInvoicePDF.ts quando {}
 */
 