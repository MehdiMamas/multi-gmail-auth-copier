export interface EmailFixture {
  name: string;
  subject: string;
  body: string;
  expect: string | null;
}

export const emailFixtures: EmailFixture[] = [
  {
    name: 'google',
    subject: 'Your Google verification code',
    body: 'Your Google verification code is 847291. It expires in 10 minutes.',
    expect: '847291',
  },
  {
    name: 'microsoft',
    subject: 'Microsoft account security code',
    body: 'Use 193847 to verify your sign-in.',
    expect: '193847',
  },
  {
    name: 'amazon otp with dash',
    subject: 'Amazon OTP',
    body: '123-456 is your Amazon OTP. Do not share it.',
    expect: '123456',
  },
  {
    name: 'bank pin',
    subject: 'Security code',
    body: 'Your one-time PIN is 445566.',
    expect: '445566',
  },
  {
    name: 'spaced digits',
    subject: 'Login code',
    body: 'Enter this code: 123 456',
    expect: '123456',
  },
  {
    name: 'alphanumeric',
    subject: 'Verification code',
    body: 'Your code is A1B2C3',
    expect: 'A1B2C3',
  },
  {
    name: 'order number is not a code',
    subject: 'Order confirmation',
    body: 'Thanks for your order. Your order number is 48219375.',
    expect: null,
  },
  {
    name: 'year nearby is ignored',
    subject: 'Verification code',
    body: 'Your verification code is 551209.\n\n© 2024 Acme Bank',
    expect: '551209',
  },
  {
    name: 'price is ignored',
    subject: 'Verification code',
    body: 'Your code is 778899. Order total $12.99.',
    expect: '778899',
  },
  {
    name: 'phone number is ignored',
    subject: 'Your code',
    body: 'Your verification code is 909090. Call +1 202 555 0148 if you did not request it.',
    expect: '909090',
  },
  {
    name: 'plain number without a keyword',
    subject: 'Hello',
    body: 'See you at 123456.',
    expect: null,
  },
  {
    name: 'date is ignored',
    subject: 'Sign-in code',
    body: 'Code 246810 requested on 12/05/2024.',
    expect: '246810',
  },
];
