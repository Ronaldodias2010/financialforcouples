import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';

interface ApprovalEmailProps {
  partnerName: string;
  referralCode: string;
  rewardAmount: number;
  rewardType: 'monetary' | 'other';
  rewardCurrency?: string;
  rewardDescription?: string;
}

export const ApprovalEmailEN = ({ 
  partnerName, 
  referralCode, 
  rewardAmount, 
  rewardType = 'monetary',
  rewardCurrency = 'USD',
  rewardDescription 
}: ApprovalEmailProps) => {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "🎉 Your partnership application has been approved!"),
    React.createElement(
      Body,
      { style: main },
      React.createElement(
        Container,
        { style: container },
        React.createElement(
          'div',
          { style: header },
          React.createElement(Img, {
            src: "https://elxttabdtddlavhseipz.lovableproject.com/lovable-uploads/1f5e0469-b056-4cf9-9583-919702fa8736.png",
            width: "80",
            height: "80",
            alt: "Couples Financials",
            style: logo
          }),
          React.createElement(
            Heading,
            { style: h1 },
            "Couples Financials"
          )
        ),
        React.createElement(
          Heading,
          { style: h2 },
          `Congratulations, ${partnerName}!`
        ),
        React.createElement(
          Text,
          { style: text },
          "Your partnership application has been approved!"
        ),
        React.createElement(
          'div',
          { style: codeSection },
          React.createElement(
            Heading,
            { style: h3 },
            "Your Referral Code"
          ),
          React.createElement(
            'div',
            { style: codeContainer },
            React.createElement(
              'span',
              { style: codeText },
              referralCode
            )
          ),
          React.createElement(
            Text,
            { style: codeDescription },
            "This is your exclusive code to share with your audience."
          )
        ),
        React.createElement(
          'div',
          { style: rewardSection },
          React.createElement(
            Heading,
            { style: h3 },
            `${rewardType === 'monetary' ? '💰' : '🎁'} How Rewards Work`
          ),
          React.createElement(
            'ul',
            { style: list },
            React.createElement('li', null, "For each person who signs up using your code and makes the ANNUAL FEE payment"),
            React.createElement('li', null, `You will receive: ${
              rewardType === 'monetary' 
                ? `${rewardCurrency === 'USD' ? '$' : 'R$'} ${rewardAmount.toFixed(2)}` 
                : rewardDescription || `Reward: ${rewardAmount}`
            }`),
            React.createElement('li', null, rewardType === 'monetary' ? 'Payment will be processed after user payment confirmation' : 'Reward will be processed according to agreed terms'),
            React.createElement('li', null, `You will receive a monthly report with your ${rewardType === 'monetary' ? 'earnings' : 'results'}`)
          )
        ),
        React.createElement(
          'div',
          { style: instructionsSection },
          React.createElement(
            Heading,
            { style: h3 },
            "📝 How to Use Your Code"
          ),
          React.createElement(
            'ol',
            { style: list },
            React.createElement('li', null, `Share your code ${referralCode} with your audience`),
            React.createElement('li', null, "Direct them to: couplesfinancials.com"),
            React.createElement('li', null, "During registration, they must enter your code in the 'Promo Code' section"),
            React.createElement('li', null, "Track your results in the monthly dashboard we'll send")
          )
        ),
        React.createElement(Hr, { style: hr }),
        React.createElement(
          'div',
          { style: supportSection },
          React.createElement(
            Heading,
            { style: h4 },
            "📞 Support & Questions"
          ),
          React.createElement(
            Text,
            { style: supportText },
            "Contact us: contato@couplesfinancials.com",
            React.createElement('br', null),
            "We're here to help you succeed in our partnership!"
          )
        ),
        React.createElement(
          Text,
          { style: footer },
          "Thank you for being part of the Couples Financials family! 🚀"
        )
      )
    )
  );
};

const main = {
  backgroundColor: '#1a1a2e',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  minHeight: '100vh',
  padding: '20px 0',
};

const container = { 
  backgroundColor: '#16213e', 
  margin: '0 auto', 
  padding: '40px 20px', 
  maxWidth: '600px', 
  borderRadius: '12px', 
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' 
};

const header = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  marginBottom: '32px', 
  gap: '16px' 
};

const logo = { borderRadius: '8px' };

const h1 = { 
  color: '#e94560', 
  fontSize: '28px', 
  fontWeight: 'bold', 
  margin: '0', 
  textAlign: 'center' as const 
};

const h2 = { 
  color: '#ffffff', 
  fontSize: '24px', 
  fontWeight: '600', 
  margin: '32px 0 24px 0', 
  textAlign: 'center' as const 
};

const h3 = { 
  color: '#22c55e', 
  fontSize: '18px', 
  fontWeight: '600', 
  margin: '0 0 16px 0' 
};

const h4 = { 
  color: '#0369a1', 
  fontSize: '16px', 
  fontWeight: '600', 
  margin: '0 0 8px 0' 
};

const text = { 
  color: '#e2e8f0', 
  fontSize: '16px', 
  lineHeight: '24px', 
  margin: '16px 0' 
};

const codeSection = { 
  backgroundColor: '#f0fdf4', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #bbf7d0' 
};

const codeContainer = { 
  backgroundColor: 'white', 
  padding: '16px', 
  borderRadius: '6px', 
  textAlign: 'center' as const, 
  margin: '16px 0' 
};

const codeText = { 
  fontSize: '24px', 
  fontWeight: 'bold', 
  color: '#059669', 
  letterSpacing: '2px' 
};

const codeDescription = { 
  margin: '16px 0 0 0', 
  color: '#166534', 
  fontSize: '14px' 
};

const rewardSection = { 
  backgroundColor: '#fffbeb', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px', 
  border: '1px solid #fde68a' 
};

const instructionsSection = { 
  backgroundColor: '#f1f5f9', 
  padding: '24px', 
  borderRadius: '8px', 
  marginBottom: '24px' 
};

const supportSection = { 
  backgroundColor: '#e0f2fe', 
  padding: '20px', 
  borderRadius: '8px', 
  borderLeft: '4px solid #0284c7' 
};

const list = { 
  color: '#92400e', 
  margin: '0', 
  paddingLeft: '20px' 
};

const supportText = { 
  margin: '0', 
  color: '#0369a1', 
  fontSize: '14px' 
};

const hr = { 
  borderColor: '#334155', 
  margin: '32px 0' 
};

const footer = { 
  color: '#94a3b8', 
  fontSize: '14px', 
  lineHeight: '20px', 
  margin: '32px 0 16px 0', 
  textAlign: 'center' as const 
};