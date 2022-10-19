const dropdownOrg = document.getElementById('dropdownOrg')
const org = document.querySelector('.org')
dropdownOrg.addEventListener('click', () =>{
    org.classList.toggle('dropdown')
})
const dropdownAtt = document.getElementById('dropdownAtt')
const att = document.querySelector('.att')
dropdownAtt.addEventListener('click', () =>{
    att.classList.toggle('dropdown')
})
const dropdownLev = document.getElementById('dropdownLev')
const lev = document.querySelector('.lev')
dropdownLev.addEventListener('click', () =>{
    lev.classList.toggle('dropdown')
})
const dropdownLoan = document.getElementById('dropdownLoan')
const loan = document.querySelector('.loan')
dropdownLoan.addEventListener('click', () =>{
    loan.classList.toggle('dropdown')
})