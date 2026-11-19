import axiosClient from '@/api/axiosClient';

function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Week 5-6 Feature 3: real PDF invoice download. Calls the backend, which streams back
// an actual application/pdf generated from the real Invoice row -- never a static file.
export const invoiceService = {
  downloadPdf: async (invoiceId: number, filenameHint: string) => {
    const { data } = await axiosClient.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
    downloadFile(data, `${filenameHint}.pdf`);
  },
};
