function tableSearch(){
    let input, filter, table, tr, td, txtValue;

    input = document.getElementById('myInput');
    filter = input.value.toUpperCase();
    table = document.getElementById('example');
    tr = table.getElementsByTagName('tr');

    for(let i = 0; i < tr.length; i++){
        td = tr[i].getElementsByTagName('td');
        for(let j = 0; j < td.length; j++){
            if(td[j]){
                txtValue = td[j].textContent || td[j].innerText;
                txtValue = txtValue.toUpperCase();
                if(txtValue.indexOf(filter) > -1){
                    tr[i].style.display = '';
                    break;
                }
                else{
                    tr[i].style.display = 'none'
                }
            }
        }
        
    }
    // console.log('yes');
}