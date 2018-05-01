#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// merge two csv tables into one
void merge(char* file1, char *file2);

int main(int argc, char const *argv[]) {
    merge("./2016NBA_gamelogs.csv", "pcavecdata.csv");
  return 0;
}

void merge(char* file1, char *file2) {
    FILE* input1 = fopen(file1, "r");
    FILE* input2 = fopen(file2, "r");

    FILE* out = fopen("data.csv", "w+");

    char buff1[1024];
    char buff2[1024];
    char outbuff[2048];
    memset(buff1, 0, 1024);
    memset(buff2, 0, 1024);
    memset(outbuff, 0, 2048);

    while(fgets(buff1, 1024, input1) != NULL && fgets(buff2, 1024, input2) != NULL){
        char* it = buff1;
        while(*it++ != '\n');
        *--it = 0;

        strcpy(outbuff, buff1);
        strcat(outbuff, ",");
        strcat(outbuff, buff2);

        fwrite(outbuff, 1, strlen(outbuff), out);
    }

    fclose(input1);
    fclose(input2);
    fclose(out);
}




