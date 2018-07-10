const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const htdocs = 'E:\\xampp\\htdocs\\K7X6S1\\';
const db = new sqlite3.Database('./plan.db', (err) => {
  if (err) {
    console.error('Line 10: ' + err.message);
  } else {
    console.log('Henlo from database.');
    fs.writeFileSync(htdocs + 'plan.html',
      '\ufeff<table><tbody>\n\t<tr>' +
      '<th class="time wd"></th>' +
      '<th class="wd wd-1">Poniedziałek</th>' +
      '<th class="wd wd-2">Wtorek</th>'+
      '<th class="wd wd-3">Środa</th>' +
      '<th class="wd wd-4">Czwartek</th>' +
      '<th class="wd wd-5">Piątek</th>' +
      '</tr>\n', null, 'utf8'
    );
    generateFromNow(() => {
      fs.readFile(htdocs + 'plan.html', (err, data) => {
        if(err) {
          console.err('Line 26: ' + err.message);
        } else {
          fill(data, () => {
              db.close(() => {
              });
          });
        }
      });
    });
  }
});

var blok = ['', '8:00-9:35', '9:50-11:25', '11:40-13:15', '13:30-15:05', '15:45-17:20', '17:35-19:10', '19:25-21:00'];
var wydarzenie = {
  Egzamin: 'E',
  Kolokwium: 'K',
  Wejściówka: 'W',
  Sprawozdanie: 'S',
  Projekt: 'P',
};

var przedmioty = {
  'Algebra liniowa': 'all',
  'Algorytmy i struktury danych': 'als',
  'Analiza matematyczna 1': 'am1',
  'Analiza matematyczna II': 'an',
  'Architektura i organizacja komputerów II': 'aokii',
  'Architektura i organizacja komputerów I': 'aok',
  'Fizyka': 'fiz',
  'Matematyka dyskretna': 'md',
  'Matematyka dyskretna II': 'md2',
  'Podstawy elektrotechniki i elektroniki': 'peie',
  'Programowanie niskopoziomowe i analiza kodu': 'pnak',
  'Rachunek prawdopodobieństwa': 'rp',
  'Teoria grafów i sieci': 'tgs',
  'Teoria informacji i kodowania': 'tik',
  'Teoretyczne podstawy informatyki': 'tpi',
  'Wychowanie fizyczne': 'wf',
  'Wprowadzenie do programowania': 'wdp',
  'Podstawy podzespołów komputerów': 'ppk',
  'wolne': 'wolne'
}

function generateFromNow(callback) {
  var from, to, week = [];
  db.serialize(() => {
    db.get("SELECT data FROM plan ORDER BY data ASC", [], (err, row) => {
      from = moment(row.data).day(0);
    });
    db.get("SELECT data FROM plan ORDER BY data DESC", [], (err, row) => {
      to = moment(row.data).day(6);
      for(var d = from; d <= to; d.add(1, 'day')) {
        if(d.day() == 0) {
          write('\t<tr class="w-' + (parseInt(d.format('W'))+1));
          if(d.isBefore(moment(), 'week')) {
            write(' date p"><td class="time"></td>');
          } else {
            write(' date f"><td class="time"></td>');
          }
        } else if(d.day() == 6) {
          write('</tr>\n');
          for(var i = 1; i < 8; i++) {
            write('\t<tr class="w-' + d.format('W'));
            if(d.isBefore(moment(), 'week')) {
              write(' p"><td class="time" id="b-' + i + '">' + blok[i] + '</td>');
            } else {
              write(' f"><td class="time" id="b-' + i + '">' + blok[i] + '</td>');
            }
            for(var j = 1; j < 6; j++) {
              write('<td class="d-' + week[j] + '" id="b-'+ (parseInt(d.day())-6+i) + '"></td>');
            }
            write('</tr>\n');
          }
        } else {
          week[d.day()] = d.format('MM-DD');
          write('<td class="d-' + d.format('MM-DD'));
          if(d.isBefore(moment(), 'week')) {
            write(' p">');
          } else {
            write(' f">');
          }
          write(d.format('MM-DD') + '</td>');
        }
      }
      write('</tbody></table>');
      callback();
    });
    console.log('Generated plan.html @ ' + htdocs);
  });
}

function write(str) {
  fs.appendFileSync(htdocs + 'plan.html', str);
}

function fill(data, callback) {
  const dom = new JSDOM(data);
  db.all("SELECT data, blok, przedmiot, typ, numer, sala, wydarzenie FROM plan ORDER BY data", [], (err, rows) => {
    if(err) {
      console.error('Line 95: ' + err.message);
    } else {
      for(var row of rows) {
        if(moment(row.data).day() != 6 && moment(row.data).day() != 7) {
          if(row.wydarzenie != null) {
            console.log(wydarzenie[row.wydarzenie]);
            // console.log(row.data + ' ' + row.wydarzenie);
            dom.window.document.querySelector("#b-" + row.blok + ".d-" + moment(row.data).format('MM-DD')).classList.add(wydarzenie[row.wydarzenie]);
          }
          console.log('przedmiot: ' + przedmioty[row.przedmiot]);
          dom.window.document.querySelector("#b-" + row.blok + ".d-" + moment(row.data).format('MM-DD')).classList.add(przedmioty[row.przedmiot]);
          dom.window.document.querySelector("#b-" + row.blok + ".d-" + moment(row.data).format('MM-DD')).innerHTML = row.przedmiot + ' (' + row.typ + ') ' + row.sala + ' [' + row.numer + ']';
        }
      }
      fs.writeFileSync(htdocs + 'plan.html', dom.window.document.querySelector('table').outerHTML);
    }
  });
}
