const spawn = require('child_process').spawn;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./plan.db', (err) => {
  if (err) {
    console.error(err.message);
  } else console.log('Henlo from database.');
});

const DEBUG = 0;

var date = [2018, 0, 0];

var newline = {
  data: '',
  blok: 0,
  przedmiot: '',
  typ: '',
  numer: 0,
  sala: '',
  prowadzacy: '',
  wydarzenie: ''
}

var blok = ['08:00', '09:50', '11:40', '13:30', '15:45', '17:35', '19:25'];

var przedmioty = {
  All: 'Algebra liniowa',
  Als: 'Algorytmy i struktury danych',
  Am1: 'Analiza matematyczna 1',
  An: 'Analiza matematyczna II',
  AoKII: 'Architektura i organizacja komputerów II',
  Aok: 'Architektura i organizacja komputerów I',
  F: 'Fizyka',
  MD: 'Matematyka dyskretna',
  Md2: 'Matematyka dyskretna II',
  Peie: 'Podstawy elektrotechniki i elektroniki',
  Pnak: 'Programowanie niskopoziomowe i analiza kodu',
  Rp: 'Rachunek prawdopodobieństwa',
  Tgs: 'Teoria grafów i sieci',
  Tik: 'Teoria informacji i kodowania',
  Tpi: 'Teoretyczne podstawy informatyki',
  WF: 'Wychowanie fizyczne',
  WdP: 'Wprowadzenie do programowania',
  ppk: 'Podstawy podzespołów komputerów',
  wolne: 'wolne'
}

// var typyzajec = {
//   Zp: 'Zaliczenie poprawkowe',
//   Ep: 'Egzamin poprawkowy',
//   w: 'Wykład',
//   E: 'Egzamin',
//   ć: 'Ćwiczenia',
//   L: 'Laboratorium',
//   Zal: 'Zaliczenie'
// }

var typyzajec = {
  Zp: 'Zp',
  Ep: 'Ep',
  w: 'W',
  E: 'E',
  ć: 'Ć',
  L: 'L',
  Zal: 'Z'
};

var getType = /\(([^)]+)\)/;
var getNumber = /\[([^\]]+)\]/;

db.serialize(() => {
  // db.run('DROP TABLE plan');
  db.run("CREATE TABLE IF NOT EXISTS plan(data TEXT NOT NULL, blok INT NOT NULL, przedmiot TEXT NOT NULL, typ TEXT NOT NULL, numer INT NOT NULL, sala TEXT NOT NULL, prowadzacy TEXT NOT NULL, wydarzenie TEXT, komentarz TEXT, pomoce TEXT, CONSTRAINT zajecia UNIQUE(przedmiot, typ, numer))", (err) => {
    if(err) {
      console.error(err.message);
    } else console.log('It lives!');
  });
});

var python = spawn('py', ['./parser.py']);

python.on('exit', (code) => {
  console.log(`python.py exited with code ${code}`);
});

python.stdout.once('data', (data)=>{
  data = data.toString();

  console.log(data);

  //zastepowanie znakow
  {
    var start = data.indexOf('<');
    data = data.substr(start);
    //znaki
    {
      data = data.split('\\xb3').join('ł');
      data = data.split('\\xa3').join('Ł');
      data = data.split('\\xb6').join('ś');
      data = data.split('\\xa6').join('Ś');
      data = data.split('\\xb1').join('ą');
      data = data.split('\\xa1').join('Ą');
      data = data.split('\\xea').join('ę');
      data = data.split('\\xe6').join('ć');
      data = data.split('\\xc6').join('Ć');
      data = data.split('\\xf3').join('ó');
      data = data.split('\\xbf').join('ż');
      data = data.split('\\\'').join('\'');
      data = data.split('\\\\').join('\\');
      data = data.split('\\n').join(' ');
      data = data.split('\\t').join(' ');
      data = data.split('\\r').join(' ');
    }
    //miesiace
    {
      data = data.split('<nobr>').join(' ');
      data = data.split('<br>I</nobr>').join(' 01');
      data = data.split('<br>II</nobr>').join(' 02');
      data = data.split('<br>III</nobr>').join(' 03');
      data = data.split('<br>IV</nobr>').join(' 04');
      data = data.split('<br>V</nobr>').join(' 05');
      data = data.split('<br>VI</nobr>').join(' 06');
      data = data.split('<br>VII</nobr>').join(' 07');
      data = data.split('<br>VIII</nobr>').join(' 08');
      data = data.split('<br>IX</nobr>').join(' 09');
      data = data.split('<br>X</nobr>').join(' 10');
      data = data.split('<br>XI</nobr>').join(' 11');
      data = data.split('<br>XII</nobr>').join(' 12');
      data = data.split('<br>').join(' ');
    }
    //brak zajec
    data = data.split('&nbsp;').join(' wolne ');
  }

  const dom = new JSDOM(data);
  if(!dom.window.document.querySelector(".tableFormList2SheTeaGrpHTM")) {
    process.exit(503);
  }
  plan = '<table>';
  plan = plan.concat(dom.window.document.querySelector(".tableFormList2SheTeaGrpHTM").innerHTML);
  plan = plan.concat('</table>');

  const planDOM = new JSDOM(plan);

  for(var cell in planDOM.window.document.querySelector("tbody").rows[0].cells) {
    if(!isNaN(cell) && cell > 1 && cell < 24) {
      for(var row in planDOM.window.document.querySelector("tbody").rows) {
        if(!isNaN(row)) {
          var tmp = parseInt(cell);
          var temp = planDOM.window.document.querySelector("tbody").rows[row].cells[tmp].textContent.split(' ');
          if(row % 8 == 0) {
            tmp++;
            date[1] = planDOM.window.document.querySelector("tbody").rows[row].cells[tmp].textContent.split(' ')[2];
            date[2] = planDOM.window.document.querySelector("tbody").rows[row].cells[tmp].textContent.split(' ')[1];
          } else if(temp[1] != 'wolne') {
            newline.data = date.join('-')
            newline.blok = row%8;
            newline.przedmiot = przedmioty[temp[1]];
            newline.typ = typyzajec[getType.exec(temp[2])[1]];
            if(newline.typ == 'E' || newline.typ == 'Z' || newline.typ == 'Ep' || newline.typ == 'Zp') {
              newline.wydarzenie = 'Egzamin';
            } else {
              newline.wydarzenie = '';
            }
            switch(temp.length) {
              case 6:
                newline.sala = temp[3];
                newline.prowadzacy = temp[4];
                newline.numer = getNumber.exec(temp[5])[1];
                break;
              case 7:
                newline.sala = temp[3] + ' ' + temp[4];
                newline.prowadzacy = temp[5];
                newline.numer = getNumber.exec(temp[6])[1];
                break;
              case 8:
                newline.sala = temp[3] + ' ' + temp[4];
                newline.prowadzacy = temp[5] + ', ' + temp[6];
                newline.numer = getNumber.exec(temp[7])[1];
                break;
              case 11:
                newline.sala = temp[3] + ' ' + temp[4] + ', ' + temp[6] + ' ' + temp[7];
                newline.prowadzacy = temp[8] + ', ' + temp[9];
                newline.numer = getNumber.exec(temp[10])[1];
                break;
            }
            if(newline.wydarzenie === 'Egzamin') {
              db.serialize(() => {
                db.run("UPDATE plan SET data=?, blok=?, sala=? WHERE przedmiot=? AND typ=? AND numer=?", [newline.data, newline.blok, newline.sala, newline.przedmiot, newline.typ, newline.numer], (err) => {
                  if(err) {
                    console.error('Update: ' + err.message);
                  } else if(DEBUG) console.log('Updated: ' + newline['data'] + ' where: przedmiot=' + newline['przedmiot'] + ' and typ=' + newline['typ'] + ' and numer=' + newline['numer']);
                });
                db.run("INSERT OR IGNORE INTO plan(data, blok, przedmiot, typ, numer, sala, prowadzacy, wydarzenie) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [newline.data, newline.blok, newline.przedmiot, newline.typ, newline.numer, newline.sala, newline.prowadzacy, newline.wydarzenie], (err) => {
                  if(err) {
                    console.error('Insert: ' + err.message);
                  } else if(DEBUG) console.log('Inserted: ' + newline['data'] + newline['przedmiot'] + newline['typ'] + newline['numer'] + newline['sala'] + newline['prowadzacy'] + newline['wydarzenie']);
                });
              });
            } else {
              db.serialize(() => {
                db.run("UPDATE plan SET data=?, blok=?, sala=? WHERE przedmiot=? AND typ=? AND numer=?", [newline.data, newline.blok, newline.sala, newline.przedmiot, newline.typ, newline.numer], (err) => {
                  if(err) {
                    console.error('Update: ' + err.message);
                  } else if(DEBUG) console.log('Updated: ' + newline['data'] + ' where: przedmiot=' + newline['przedmiot'] + ' and typ=' + newline['typ'] + ' and numer=' + newline['numer']);
                });
                db.run("INSERT OR IGNORE INTO plan(data, blok, przedmiot, typ, numer, sala, prowadzacy) VALUES (?, ?, ?, ?, ?, ?, ?)", [newline.data, newline.blok, newline.przedmiot, newline.typ, newline.numer, newline.sala, newline.prowadzacy], (err) => {
                  if(err) {
                    console.error('Insert: ' + err.message);
                  } else if(DEBUG) console.log('Inserted: ' + newline['data'] + newline['przedmiot'] + newline['typ'] + newline['numer'] + newline['sala'] + newline['prowadzacy']);
                });
              });
            }
          }
        }
      }
    }
  }

  db.close(() => {
    process.exit(0);
  });
});
