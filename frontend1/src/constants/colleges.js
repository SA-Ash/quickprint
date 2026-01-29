export const COLLEGES = [
    { value: '', label: 'Select Your College' },
    { value: 'ou', label: 'Osmania University' },
    { value: 'jntu', label: 'JNTU Hyderabad' },
    { value: 'iit', label: 'IIT Hyderabad' },
    { value: 'bits', label: 'BITS Pilani, Hyderabad' },
    { value: 'cbit', label: 'Chaitanya Bharathi Institute of Technology (CBIT)' },
    { value: 'vasavi', label: 'Vasavi College of Engineering' },
    { value: 'sri_chaitanya', label: 'Sri Chaitanya College' },
    { value: 'mgit', label: 'Mahatma Gandhi Institute of Technology (MGIT)' },
    { value: 'cvr', label: 'CVR College of Engineering' },
    { value: 'vbit', label: 'Vignana Bharathi Institute of Technology (VBIT)' },
];

export const getCollegeLabel = (value) => {
    const college = COLLEGES.find(c => c.value === value);
    return college ? college.label : value;
};
export const isValidCollege = (value) => {
    return COLLEGES.some(c => c.value === value);
};

export default COLLEGES;
