# **App Name**: discoversapp

## Core Features:

- Main Page and Kakao Login: Main page with background image, coupon code input, and Kakao login integration. Automatically switches to Kakao login after coupon code entry. Module based architecture for easy maintenance.
- Interactive Quest Board: Interactive game board with progress bar showing quest completion. The number of quests are set up by the administrator
- Switchable Explorer Characters: Display character(male/female explorer) that user can switch
- Completion trigger and rewards page access: A button will appear to take the player to the Rewards page if all tasks are completed.
- QR Code Scanning and Validation: QR code scanner page with real-time feedback on scan success or failure. In the dev environment, you can confirm the right code with 'validation button'
- Dynamic Coupon Reward System: Reward page displaying a coupon with an expiration reset at 00:00 daily. Features admin validation via a code that disables the coupon.
- Admin Configuration Panel: Admin panel protected by Kakao login for managing users, quests, coupons, and settings.

## Style Guidelines:

- Primary color: Earthy Green (#6B8E23) to evoke a natural and adventurous feeling.
- Background color: Desaturated Beige (#F5F5DC) to complement the forest theme.
- Accent color: Warm Yellow (#FFC857) to highlight interactive elements.
- Body font: 'Jua' from 'next/font/google' to evoke the feeling of 동화속에 어린이 탐험가
- Illustrative icons that capture the essence of a children's storybook. It feels warm, cute and organic, not corporate.
- Modular design for easy content updates and maintenance, especially for managing quests and settings.
- Subtle transitions and animations when switching between pages or completing tasks to enhance user experience.