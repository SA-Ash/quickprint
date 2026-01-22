export const ordersData = [
  {
    id: "QP-2504",
    customer: "Rahul Singh",
    date: "Apr 14, 2025",
    college: "CBIT",
    total: "₹24.50",
    status: "Pending",
    items: 3,
    payment: "Paid",
    contact: "rahul.singh@example.com",
    phone: "+91 98765 43210",
    files: ["document.pdf", "presentation.pptx"],
    notes: "Need spiral binding for all documents"
  },
  {
    id: "QP-2503",
    customer: "Priya Patel",
    date: "Apr 14, 2025",
    college: "Anurag University",
    total: "₹18.75",
    status: "Processing",
    items: 2,
    payment: "Paid",
    contact: "priya.patel@example.com",
    phone: "+91 97654 32109",
    files: ["assignment.doc"],
    notes: "Print in color, single sided"
  },
  {
    id: "QP-2502",
    customer: "Aditya Sharma",
    date: "Apr 13, 2025",
    college: "GITAM",
    total: "₹32.00",
    status: "Ready",
    items: 5,
    payment: "Pending",
    contact: "aditya.sharma@example.com",
    phone: "+91 96543 21098",
    files: ["thesis.pdf", "charts.xlsx"],
    notes: "Urgent - needed by tomorrow 10 AM"
  },
  {
    id: "QP-2501",
    customer: "Sneha Reddy",
    date: "Apr 13, 2025",
    college: "CIN",
    total: "₹15.25",
    status: "Completed",
    items: 1,
    payment: "Paid",
    contact: "sneha.reddy@example.com",
    phone: "+91 95432 10987",
    files: ["notes.pdf"],
    notes: "Already picked up"
  },
  {
    id: "QP-2500",
    customer: "Vikram Rao",
    date: "Apr 12, 2025",
    college: "Mallareddy",
    total: "₹42.75",
    status: "Cancelled",
    items: 4,
    payment: "Refunded",
    contact: "vikram.rao@example.com",
    phone: "+91 94321 09876",
    files: ["project.pdf", "references.doc"],
    notes: "Customer requested cancellation"
  },
  {
    id: "QP-2499",
    customer: "Neha Gupta",
    date: "Apr 12, 2025",
    college: "CBIT",
    total: "₹28.50",
    status: "Processing",
    items: 2,
    payment: "Paid",
    contact: "neha.gupta@example.com",
    phone: "+91 93210 98765",
    files: ["report.pdf"],
    notes: "Print on both sides"
  },
  {
    id: "QP-2498",
    customer: "Arjun Mehta",
    date: "Apr 11, 2025",
    college: "GITAM",
    total: "₹36.25",
    status: "Ready",
    items: 3,
    payment: "Paid",
    contact: "arjun.mehta@example.com",
    phone: "+91 92109 87654",
    files: ["paper.pdf", "images.zip"],
    notes: "High quality paper requested"
  },
  {
    id: "QP-2497",
    customer: "Divya Kumar",
    date: "Apr 11, 2025",
    college: "Anurag University",
    total: "₹21.00",
    status: "Completed",
    items: 2,
    payment: "Paid",
    contact: "divya.kumar@example.com",
    phone: "+91 91098 76543",
    files: ["assignment.pdf"],
    notes: "Delivered to college admin office"
  },
  {
    id: "QP-2496",
    customer: "Sanjay Verma",
    date: "Apr 10, 2025",
    college: "CIN",
    total: "₹38.50",
    status: "Processing",
    items: 4,
    payment: "Pending",
    contact: "sanjay.verma@example.com",
    phone: "+91 90987 65432",
    files: ["project_report.pdf", "appendices.doc"],
    notes: "Need by Friday evening"
  },
  {
    id: "QP-2495",
    customer: "Anjali Desai",
    date: "Apr 10, 2025",
    college: "Mallareddy",
    total: "₹19.75",
    status: "Pending",
    items: 1,
    payment: "Paid",
    contact: "anjali.desai@example.com",
    phone: "+91 89876 54321",
    files: ["notes.pdf"],
    notes: "Standard printing, black and white"
  }
];

export const statusOptions = [
  "All",
  "Pending",
  "Processing",
  "Ready",
  "Completed",
  "Cancelled"
];

    export const statusStyles = {
  Pending: "bg-gray-50 text-gray-700 border border-gray-200",
  Processing: "bg-blue-50 text-blue-700 border border-blue-200",
  Ready: "bg-purple-50 text-purple-700 border border-purple-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-gray-100 text-gray-700 border border-gray-300",
};

export const paymentStyles = {
  Paid: "bg-green-50 text-green-700 border border-green-200",
  Pending: "bg-gray-50 text-gray-700 border border-gray-200",
  Refunded: "bg-gray-100 text-gray-700 border border-gray-300",
};

{}