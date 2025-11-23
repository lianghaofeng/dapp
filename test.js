const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('WTF Promise resolved');
  }, 1000);
});

// 1秒后输出 'WTF Promise resolved'
promise
  .then(value => {
    console.log(value);
    return value + ' WTF';
  })
  .then(newValue => console.log(newValue));