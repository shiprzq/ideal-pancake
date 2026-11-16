let visitor=localStorage.getItem('yorumi-library')||localStorage.getItem('anipahe-library');
if(!visitor)visitor=crypto.randomUUID();
localStorage.setItem('yorumi-library',visitor);
export default visitor;
