function numbersOnly(input){
    var numbers = /[^0-9]/gi;
    input.value = input.value.replace(numbers, "");
}