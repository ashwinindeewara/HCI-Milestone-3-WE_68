import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '../../src/constants/colors';
import Theme from '../../src/constants/theme';
import { apiClient, FreelancerApiService, getCurrentUser } from '../../src/services/api';

interface HistoryItem {
  id: string;
  title: string;
  sub: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'In Escrow' | 'Released' | 'Withdrawn';
  destination?: string;
}

interface LinkedAccount {
  id: string;
  name: string;
  type: string;
  detail: string;
  badge: string;
  isDefault: boolean;
  icon: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  paymentType?: string;
  accountType?: 'Checking' | 'Savings';
}

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 'tx-1',
    title: 'E-Commerce Redesign',
    sub: 'UI Design Phase Milestone',
    date: 'Oct 12, 2024',
    amount: 3150,
    formattedAmount: '$3,150.00',
    status: 'In Escrow',
  },
  {
    id: 'tx-2',
    title: 'Mobile App Contract',
    sub: 'API Specifications Milestone',
    date: 'Oct 01, 2024',
    amount: 4000,
    formattedAmount: '$4,000.00',
    status: 'Released',
  },
  {
    id: 'tx-3',
    title: 'E-Commerce Redesign',
    sub: 'UX Wireframes & User Journey',
    date: 'Sep 28, 2024',
    amount: 1260,
    formattedAmount: '$1,260.00',
    status: 'Released',
  },
  {
    id: 'tx-4',
    title: 'Marketing Brand Strategy',
    sub: 'Initial Brand Audit & Assets',
    date: 'Sep 15, 2024',
    amount: 4540,
    formattedAmount: '$4,540.00',
    status: 'Released',
  },
  {
    id: 'tx-5',
    title: 'Mobile App Contract',
    sub: 'Architecture & System Design',
    date: 'Sep 10, 2024',
    amount: 2250,
    formattedAmount: '$2,250.00',
    status: 'In Escrow',
  },
];

export default function EscrowScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isChathuni =
    currentUser?.email === 'chathuniimalsha.com' ||
    (currentUser?.fullName && currentUser.fullName.toLowerCase().includes('chathuni')) ||
    (currentUser?.email && currentUser.email.toLowerCase().includes('chathuni'));

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RELEASED' | 'ESCROW' | 'WITHDRAWN'>('ALL');
  const [availableBalance, setAvailableBalance] = useState<number>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `escrow_avail_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) return parseFloat(s);
      } catch (e) {}
    }
    return isChathuni ? 9800 : 0;
  });
  const [inEscrowBalance, setInEscrowBalance] = useState<number>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `escrow_balance_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) return parseFloat(s);
      } catch (e) {}
    }
    return isChathuni ? 5400 : 0;
  });
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);

  // Withdraw Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'BANK' | 'PAYPAL' | 'CARD'>('BANK');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Linked Accounts Modal State
  const [accountsModalVisible, setAccountsModalVisible] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(() => {
    return [];
  });

  // Add Bank Account Form State
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountHolder, setNewAccountHolder] = useState(
    currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : '')
  );
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newRoutingNumber, setNewRoutingNumber] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Checking' | 'Savings'>('Checking');
  const [newPaymentType, setNewPaymentType] = useState<string>('Direct Deposit (ACH)');
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  // Milestone Detail Modal State
  const [selectedMilestoneItem, setSelectedMilestoneItem] = useState<HistoryItem | null>(null);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const u = getCurrentUser();
        const k = `escrow_history_${u?.email || u?.fullName || 'default'}`;
        const s = localStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) return p;
        }
      } catch (e) {}
    }
    return isChathuni ? DEFAULT_HISTORY : [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadLinkedAccounts = async () => {
    const activeEmail = currentUser?.email || '';
    const activeName = currentUser?.fullName || '';
    try {
      const res = await FreelancerApiService.getPayoutAccounts(activeEmail, activeName);
      const data = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(data) && data.length > 0) {
        setLinkedAccounts(data);
        return;
      }
      setLinkedAccounts([]);
    } catch {
      setLinkedAccounts([]);
    }
  };

  // Fetch real summary & transactions from backend
  useEffect(() => {
    const fetchEscrowSummary = async () => {
      try {
        const activeName = currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : '');
        const activeEmail = currentUser?.email || '';
        const res = await apiClient.get('/escrow/summary', {
          params: {
            ...(activeEmail ? { email: activeEmail } : {}),
            ...(activeEmail ? { email: activeEmail } : {}),
          },
        });
        if (res.data) {
          if (res.data.totalInEscrow != null) {
            setInEscrowBalance(res.data.totalInEscrow);
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
              const k = `escrow_balance_${currentUser?.email || currentUser?.fullName || 'default'}`;
              localStorage.setItem(k, String(res.data.totalInEscrow));
            }
          }
          if (res.data.releasedAmount != null) {
            setAvailableBalance(res.data.releasedAmount);
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
              const k = `escrow_avail_${currentUser?.email || currentUser?.fullName || 'default'}`;
              localStorage.setItem(k, String(res.data.releasedAmount));
            }
          }
        }
      } catch (err) {
        // Fallback to local default state
      }
    };

    const fetchTransactions = async () => {
      try {
        const activeName = currentUser?.fullName || (isChathuni ? 'Chathuni Imalsha' : '');
        const activeEmail = currentUser?.email || '';
        const res = await FreelancerApiService.getTransactions('ALL', activeName, activeEmail);
        const txs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (Array.isArray(txs) && txs.length > 0) {
          const mapped: HistoryItem[] = txs.map((t: any) => ({
            id: String(t.id),
            title: t.projectTitle || t.description || 'Escrow Transaction',
            sub: t.description || 'Milestone Payment',
            date: t.date || 'Recent',
            amount: t.amount || 0,
            formattedAmount: t.amount != null ? `$${t.amount.toLocaleString()}` : '$0.00',
            status: t.status === 'WITHDRAWN' ? 'Withdrawn' : t.status === 'RELEASED' ? 'Released' : 'In Escrow',
          }));
          setHistory(mapped);
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            const k = `escrow_history_${currentUser?.email || currentUser?.fullName || 'default'}`;
            localStorage.setItem(k, JSON.stringify(mapped));
          }
        } else if (!isChathuni) {
          setHistory([]);
        }
      } catch {
        if (!isChathuni) {
          setHistory([]);
        }
      }
    };

    Promise.allSettled([
      fetchEscrowSummary(),
      fetchTransactions(),
      loadLinkedAccounts(),
    ]);
  }, [currentUser?.email, currentUser?.fullName]);

  useFocusEffect(
    React.useCallback(() => {
      loadLinkedAccounts();
    }, [currentUser?.email, currentUser?.fullName])
  );

  // Handle clicking on an item in ledger
  const handleItemPress = (item: HistoryItem) => {
    setSelectedMilestoneItem(item);
    setMilestoneModalVisible(true);
  };

  // Simulate releasing an in-escrow milestone
  const releaseMilestone = (item: HistoryItem) => {
    setInEscrowBalance((prev) => Math.max(0, prev - item.amount));
    setAvailableBalance((prev) => prev + item.amount);
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, status: 'Released' } : h
      )
    );
    setMilestoneModalVisible(false);
    showToast(`✓ ${item.formattedAmount} released to your available balance!`);
  };

  // Set default account in linked accounts modal
  const handleSetDefaultAccount = async (id: string, name: string) => {
    const activeEmail = currentUser?.email || '';
    const activeName = currentUser?.fullName || '';
    const updated = linkedAccounts.map((acc) => ({
      ...acc,
      isDefault: acc.id === id,
      badge: acc.id === id ? 'Default' : 'Active',
    }));
    try {
      const response = await FreelancerApiService.setDefaultPayoutAccount(id, activeEmail);
      const savedAccount = response?.data || response;
      setLinkedAccounts((current) => current.map((account) => ({
        ...account,
        isDefault: account.id === savedAccount.id,
        badge: account.id === savedAccount.id ? 'Default' : 'Active',
      })));
      showToast(`✓ Set ${name} as default payout account`);
    } catch {
      showToast('Unable to update the default payment account.');
    }
  };

  // Remove linked account using cross icon
  const handleRemoveAccount = async (id: string, name: string) => {
    const activeEmail = currentUser?.email || '';
    const activeName = currentUser?.fullName || '';
    const remaining = linkedAccounts.filter((acc) => acc.id !== id);
    if (remaining.length > 0 && !remaining.some((acc) => acc.isDefault)) {
      remaining[0].isDefault = true;
      remaining[0].badge = 'Default';
    }
    try {
      await FreelancerApiService.deletePayoutAccount(id, activeEmail);
      setLinkedAccounts(remaining);
      showToast(`✓ Removed ${name}`);
    } catch {
      showToast('Unable to remove the payment account.');
    }
  };

  // Start editing a linked account
  const handleStartEditAccount = (acc: LinkedAccount) => {
    setEditingAccountId(acc.id);
    setBankFormError(null);
    const rawBank = acc.bankName || acc.name.replace(/\s*\((Checking|Savings)\)/i, '').trim();
    setNewBankName(rawBank);
    setNewAccountHolder(
      acc.accountHolder || (acc.detail.includes('•') ? acc.detail.split('•')[1].trim() : '')
    );
    setNewAccountNumber(acc.accountNumber || (acc.detail.match(/\d+/) ? acc.detail.match(/\d+/)![0] : ''));
    setNewRoutingNumber(
      acc.routingNumber || (acc.type.includes('Routing:') ? acc.type.split('Routing:')[1].trim() : '')
    );
    setNewAccountType(
      acc.accountType || (acc.name.includes('Savings') || acc.type.includes('Savings') ? 'Savings' : 'Checking')
    );

    let pType = 'Direct Deposit (ACH)';
    if (acc.type.includes('Debit')) pType = 'Instant Debit Card';
    else if (acc.type.includes('Wallet') || acc.type.includes('PayPal') || acc.icon === '🅿️') pType = 'Electronic Wallet';
    else if (acc.type.includes('Wire')) pType = 'Wire Transfer';
    setNewPaymentType(acc.paymentType || pType);

    setShowAddBankForm(true);
  };

  // Save or Update bank account details
  const handleSaveBankDetails = async () => {
    setBankFormError(null);
    if (!newBankName.trim()) {
      setBankFormError('Please enter the bank or provider name.');
      return;
    }
    if (!newAccountNumber.trim()) {
      setBankFormError('Please enter the account or card number.');
      return;
    }

    const last4 = newAccountNumber.trim().slice(-4) || '1234';
    let accountIcon = '🏛️';
    if (newPaymentType.includes('Debit')) accountIcon = '💳';
    else if (newPaymentType.includes('Wallet') || newPaymentType.includes('PayPal')) accountIcon = '🅿️';
    else if (newPaymentType.includes('Wire')) accountIcon = '🌐';

    const activeEmail = currentUser?.email || '';
    const activeName = currentUser?.fullName || '';
    let updatedList: LinkedAccount[] = [];

    if (editingAccountId) {
      updatedList = linkedAccounts.map((acc) => {
        if (acc.id === editingAccountId) {
          return {
            ...acc,
            name: newBankName.trim() + ' (' + newAccountType + ')',
            type: `${newPaymentType} • ${newAccountType}${newRoutingNumber.trim() ? ` • Routing: ${newRoutingNumber.trim()}` : ''}`,
            detail: `Account ending in ${last4}${newAccountHolder ? ' • ' + newAccountHolder.trim() : ''}`,
            icon: accountIcon,
            bankName: newBankName.trim(),
            accountHolder: newAccountHolder.trim(),
            accountNumber: newAccountNumber.trim(),
            routingNumber: newRoutingNumber.trim(),
            paymentType: newPaymentType,
            accountType: newAccountType,
          };
        }
        return acc;
      });
      const updatedAcc = updatedList.find((a) => a.id === editingAccountId);
      if (updatedAcc) {
        try {
          const response = await FreelancerApiService.updatePayoutAccount(editingAccountId, {
            ...updatedAcc,
            userEmail: activeEmail,
            freelancerName: activeName,
          });
          const savedAccount = response?.data || response;
          setLinkedAccounts((current) => current.map((account) => account.id === editingAccountId ? savedAccount : account));
          showToast(`✓ Updated ${newBankName.trim()} details successfully!`);
        } catch {
          showToast('Unable to save payment account changes.');
          return;
        }
      }
    } else {
      const newId = 'acc-' + Date.now();
      const newAcc: LinkedAccount = {
        id: newId,
        name: newBankName.trim() + ' (' + newAccountType + ')',
        type: `${newPaymentType} • ${newAccountType}${newRoutingNumber.trim() ? ` • Routing: ${newRoutingNumber.trim()}` : ''}`,
        detail: `Account ending in ${last4}${newAccountHolder ? ' • ' + newAccountHolder.trim() : ''}`,
        badge: 'Active',
        isDefault: linkedAccounts.length === 0,
        icon: accountIcon,
        bankName: newBankName.trim(),
        accountHolder: newAccountHolder.trim(),
        accountNumber: newAccountNumber.trim(),
        routingNumber: newRoutingNumber.trim(),
        paymentType: newPaymentType,
        accountType: newAccountType,
      };
      updatedList = [...linkedAccounts, newAcc];
      try {
        const response = await FreelancerApiService.createPayoutAccount({
          ...newAcc,
          userEmail: activeEmail,
          freelancerName: activeName,
        });
        const savedAccount = response?.data || response;
        setLinkedAccounts((current) => [...current, savedAccount]);
        showToast(`✓ Linked ${savedAccount.name || newAcc.name} (${newPaymentType}) successfully!`);
      } catch {
        showToast('Unable to save payment account.');
        return;
      }
    }

    setEditingAccountId(null);
    setNewBankName('');
    setNewAccountHolder('');
    setNewAccountNumber('');
    setNewRoutingNumber('');
    setNewPaymentType('Direct Deposit (ACH)');
    setShowAddBankForm(false);
  };

  // Handle Withdrawal Submission
  const handleWithdraw = () => {
    setWithdrawError(null);
    const amountVal = parseFloat(withdrawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setWithdrawError('Please enter a valid payout amount.');
      return;
    }

    if (amountVal > availableBalance) {
      setWithdrawError(
        `Insufficient balance. You can withdraw up to $${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
      );
      return;
    }

    setIsProcessingWithdrawal(true);

    setTimeout(() => {
      const defaultAcc = linkedAccounts.find((a) => a.isDefault) || linkedAccounts[0];
      const destinationLabel =
        selectedMethod === 'BANK'
          ? (defaultAcc ? defaultAcc.name + ' (' + defaultAcc.detail + ')' : 'Direct Deposit')
          : selectedMethod === 'PAYPAL'
            ? 'PayPal'
            : 'Debit Card';

      // Deduct from available balance
      setAvailableBalance((prev) => Math.max(0, prev - amountVal));
      setTotalWithdrawn((prev) => prev + amountVal);

      // Add payout transaction to ledger
      const newTx: HistoryItem = {
        id: 'wdr-' + Date.now(),
        title: 'Payout Withdrawal',
        sub: `Transferred to ${destinationLabel}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: amountVal,
        formattedAmount: `-$${amountVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        status: 'Withdrawn',
        destination: destinationLabel,
      };

      setHistory((prev) => [newTx, ...prev]);
      setIsProcessingWithdrawal(false);
      setWithdrawModalVisible(false);
      setWithdrawAmount('');

      showToast(`✓ Sent $${amountVal.toLocaleString()} to ${destinationLabel}`);
    }, 600);
  };

  // Filter history
  const filteredHistory = history.filter((item) => {
    if (activeFilter === 'RELEASED') return item.status === 'Released';
    if (activeFilter === 'ESCROW') return item.status === 'In Escrow';
    if (activeFilter === 'WITHDRAWN') return item.status === 'Withdrawn';
    return true;
  });

  return (
    <View style={styles.outerWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Header Bar with Centered Title & Back Button */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/dashboard');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Payments & Escrow</Text>
          <View style={styles.securityBadge}>
            <Text style={styles.securityBadgeText}>🔒 Escrow</Text>
          </View>
        </View>

        {/* Hero Card: Available Earnings */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroSubTitle}>AVAILABLE TO WITHDRAW</Text>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Instant Payout Ready</Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>
            ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <Text style={styles.heroHelperText}>
            Cleared earnings from approved milestones ready to transfer to your account.
          </Text>

          {/* Action Button Row */}
          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => {
                setWithdrawError(null);
                setWithdrawAmount(availableBalance > 0 ? availableBalance.toString() : '');
                setWithdrawModalVisible(true);
              }}
              activeOpacity={0.85}
              disabled={availableBalance <= 0}
            >
              <Text style={styles.withdrawBtnText}>💸 Withdraw Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accountsBtn}
              onPress={() => setAccountsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.accountsBtnText}>🏦 Linked Accounts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub Metrics Grid: In Escrow vs Total Released */}
        <View style={styles.gridRow}>
          <View style={styles.gridCard}>
            <View style={styles.metricIconWrap}>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
            </View>
            <Text style={styles.gridLabel}>In Escrow (Secured)</Text>
            <Text style={styles.gridValueDark}>
              ${inEscrowBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
            <Text style={styles.metricSubText}>Locked in client escrow</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Text style={{ fontSize: 16 }}>💰</Text>
            </View>
            <Text style={styles.gridLabel}>Total Released</Text>
            <Text style={styles.gridValueGreen}>
              ${(availableBalance + totalWithdrawn).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
            <Text style={styles.metricSubText}>Approved by clients</Text>
          </View>
        </View>

        {/* How Freelancers Get Paid Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerTitle}>💡 How You Get Paid</Text>
          <Text style={styles.infoBannerBody}>
            1. Client deposits funds into escrow before you begin work.{'\n'}
            2. You submit milestones via the project deliverables page.{'\n'}
            3. Client approves deliverables → funds instantly release to your balance.{'\n'}
            4. Click "Withdraw Funds" to transfer your money directly to your bank.
          </Text>
        </View>

        {/* Payment History Ledger Header & Filter Pills */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Payment & Escrow Ledger</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'RELEASED', 'ESCROW', 'WITHDRAWN'] as const).map((filter) => {
            const isSelected = activeFilter === filter;
            const label =
              filter === 'ALL'
                ? 'All'
                : filter === 'RELEASED'
                  ? 'Released'
                  : filter === 'ESCROW'
                    ? 'In Escrow'
                    : 'Withdrawals';

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History Item Cards */}
        <View style={styles.historyList}>
          {filteredHistory.length === 0 ? (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>💳</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginBottom: 6 }}>
                No Escrow Transactions
              </Text>
              <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
                {activeFilter === 'ALL'
                  ? 'No transaction activity or milestone payments recorded yet.'
                  : `No transactions found under "${activeFilter.toLowerCase()}".`}
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => {
            const isEscrow = item.status === 'In Escrow';
            const isWithdrawn = item.status === 'Withdrawn';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyCard, isWithdrawn && styles.historyCardWithdrawn]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.historyIconCircle}>
                  <Text style={{ fontSize: 18 }}>
                    {isWithdrawn ? '📤' : isEscrow ? '⏳' : '✅'}
                  </Text>
                </View>

                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.sub}</Text>
                  <Text style={styles.itemDate}>📅 {item.date}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.itemAmount,
                      isWithdrawn
                        ? styles.amountWithdrawn
                        : isEscrow
                          ? styles.amountEscrow
                          : styles.amountReleased,
                    ]}
                  >
                    {item.formattedAmount}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      isEscrow
                        ? styles.badgeEscrow
                        : isWithdrawn
                          ? styles.badgeWithdrawn
                          : styles.badgeReleased,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isEscrow
                          ? styles.badgeTextEscrow
                          : isWithdrawn
                            ? styles.badgeTextWithdrawn
                            : styles.badgeTextReleased,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }))}
        </View>
      </ScrollView>

      {/* Toast Alert */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* MODAL 1: Linked Accounts Drawer */}
      <Modal visible={accountsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Linked Payout Accounts</Text>
                <Text style={styles.modalSubtitleGray}>
                  Manage bank accounts and wallets for instant payouts
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setAccountsModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.accountsScrollList} showsVerticalScrollIndicator={false}>
              {linkedAccounts.length === 0 ? (
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🏦</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text.primary, marginBottom: 4 }}>
                    No Linked Payout Accounts
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center', marginBottom: 12 }}>
                    Add a bank account or payment method below to withdraw funds.
                  </Text>
                </View>
              ) : (
                linkedAccounts.map((acc) => (
                <View
                  key={acc.id}
                  style={[
                    styles.linkedAccountCard,
                    acc.isDefault && styles.linkedAccountCardDefault,
                  ]}
                >
                  <View style={styles.linkedAccIconCircle}>
                    <Text style={{ fontSize: 20 }}>{acc.icon}</Text>
                  </View>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.linkedAccName}>{acc.name}</Text>
                      {acc.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.linkedAccDetail}>{acc.detail}</Text>
                    <Text style={styles.linkedAccType}>{acc.type}</Text>
                  </View>

                  <View style={styles.accountActionCol}>
                    {!acc.isDefault ? (
                      <TouchableOpacity
                        style={styles.makeDefaultBtn}
                        onPress={() => handleSetDefaultAccount(acc.id, acc.name)}
                      >
                        <Text style={styles.makeDefaultBtnText}>Set Default</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.activePillCheck}>
                        <Text style={styles.activePillCheckText}>✓ Primary</Text>
                      </View>
                    )}

                    {/* Edit Option Button */}
                    <TouchableOpacity
                      style={styles.editAccountBtn}
                      onPress={() => handleStartEditAccount(acc)}
                      activeOpacity={0.75}
                      accessibilityLabel={`Edit ${acc.name}`}
                    >
                      <Text style={styles.editAccountBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    {/* Cross Icon to Remove Bank Account */}
                    <TouchableOpacity
                      style={styles.crossDeleteBtn}
                      onPress={() => handleRemoveAccount(acc.id, acc.name)}
                      activeOpacity={0.75}
                      accessibilityLabel={`Remove ${acc.name}`}
                    >
                      <Text style={styles.crossDeleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )))}

              {/* Add / Edit Bank Account Details Fields Section */}
              {showAddBankForm ? (
                <View style={styles.bankFormBox}>
                  <View style={styles.bankFormHeader}>
                    <Text style={styles.bankFormTitle}>
                      {editingAccountId ? '✏️ Edit Payout Account Details' : 'Enter Bank Account Details'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddBankForm(false);
                        setEditingAccountId(null);
                      }}
                    >
                      <Text style={styles.bankFormCancelLink}>✕ Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {bankFormError && (
                    <View style={styles.formErrorBadge}>
                      <Text style={styles.formErrorText}>{bankFormError}</Text>
                    </View>
                  )}

                  <Text style={styles.formLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Bank of America, Wells Fargo, Citibank"
                    placeholderTextColor="#94A3B8"
                    value={newBankName}
                    onChangeText={(t) => {
                      setBankFormError(null);
                      setNewBankName(t);
                    }}
                  />

                  <Text style={styles.formLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={currentUser?.fullName ? `e.g. ${currentUser.fullName}` : 'e.g. Alex Morgan'}
                    placeholderTextColor="#94A3B8"
                    value={newAccountHolder}
                    onChangeText={setNewAccountHolder}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.formLabel}>Account Number</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 1029384756"
                        placeholderTextColor="#94A3B8"
                        value={newAccountNumber}
                        onChangeText={(t) => {
                          setBankFormError(null);
                          setNewAccountNumber(t);
                        }}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.formLabel}>Routing (ABA)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 021000021"
                        placeholderTextColor="#94A3B8"
                        value={newRoutingNumber}
                        onChangeText={setNewRoutingNumber}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.formLabel}>Account Type</Text>
                  <View style={styles.typeChipsRow}>
                    {(['Checking', 'Savings'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeChip,
                          newAccountType === t && styles.typeChipActive,
                        ]}
                        onPress={() => setNewAccountType(t)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            newAccountType === t && styles.typeChipTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.formLabel, { marginTop: 12 }]}>Payment Type</Text>
                  <View style={styles.paymentTypeGrid}>
                    {[
                      { id: 'Direct Deposit (ACH)', label: 'Direct Deposit (ACH)', icon: '🏛️' },
                      { id: 'Wire Transfer', label: 'Wire Transfer', icon: '🌐' },
                      { id: 'Instant Debit Card', label: 'Instant Debit Card', icon: '⚡' },
                      { id: 'Electronic Wallet', label: 'Electronic Wallet', icon: '🅿️' },
                    ].map((pt) => {
                      const isSelected = newPaymentType === pt.id;
                      return (
                        <TouchableOpacity
                          key={pt.id}
                          style={[
                            styles.paymentTypeChip,
                            isSelected && styles.paymentTypeChipActive,
                          ]}
                          onPress={() => setNewPaymentType(pt.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.paymentTypeIcon}>{pt.icon}</Text>
                          <Text
                            style={[
                              styles.paymentTypeChipText,
                              isSelected && styles.paymentTypeChipTextActive,
                            ]}
                          >
                            {pt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.saveBankBtn}
                    onPress={handleSaveBankDetails}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveBankBtnText}>
                      {editingAccountId ? '✓ Update Account Details' : '✓ Save & Link Payout Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAccountBtn}
                  onPress={() => {
                    setEditingAccountId(null);
                    setNewBankName('');
                    setNewAccountHolder('');
                    setNewAccountNumber('');
                    setNewRoutingNumber('');
                    setNewPaymentType('Direct Deposit (ACH)');
                    setBankFormError(null);
                    setShowAddBankForm(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addAccountBtnText}>+ Add Bank Account Details</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setAccountsModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Milestone Details / Escrow Release */}
      <Modal visible={milestoneModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedMilestoneItem?.title}</Text>
                <Text style={styles.modalSubtitleGray}>{selectedMilestoneItem?.sub}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setMilestoneModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dialogAmountBox}>
              <Text style={styles.dialogAmountLabel}>Transaction Amount</Text>
              <Text style={styles.dialogAmountValue}>
                {selectedMilestoneItem?.formattedAmount}
              </Text>
              <Text style={styles.dialogDateText}>📅 Date: {selectedMilestoneItem?.date}</Text>
            </View>

            {selectedMilestoneItem?.status === 'In Escrow' ? (
              <View style={styles.escrowNoticeBox}>
                <Text style={styles.escrowNoticeTitle}>🛡️ Escrow Protection Active</Text>
                <Text style={styles.escrowNoticeBody}>
                  Funds are secured in platform escrow. Once client signs off on deliverables, the payment is released to your balance.
                </Text>

                <TouchableOpacity
                  style={styles.releaseNowBtn}
                  onPress={() => selectedMilestoneItem && releaseMilestone(selectedMilestoneItem)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.releaseNowBtnText}>⚡ Simulate Client Release ($ to Balance)</Text>
                </TouchableOpacity>
              </View>
            ) : selectedMilestoneItem?.status === 'Released' ? (
              <View style={styles.releasedNoticeBox}>
                <Text style={styles.releasedNoticeTitle}>✓ Funds Released & Cleared</Text>
                <Text style={styles.releasedNoticeBody}>
                  These earnings have been approved and added to your Available Balance. You can withdraw them anytime.
                </Text>

                <TouchableOpacity
                  style={styles.withdrawNowQuickBtn}
                  onPress={() => {
                    setMilestoneModalVisible(false);
                    setWithdrawAmount(selectedMilestoneItem.amount.toString());
                    setWithdrawModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.withdrawNowQuickBtnText}>💸 Withdraw This Amount</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.withdrawnNoticeBox}>
                <Text style={styles.withdrawnNoticeTitle}>📤 Payout Transferred</Text>
                <Text style={styles.withdrawnNoticeBody}>
                  Destination: {selectedMilestoneItem?.destination || 'Primary Checking Account'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.dialogCloseBtn}
              onPress={() => setMilestoneModalVisible(false)}
            >
              <Text style={styles.dialogCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Withdrawal Drawer */}
      <Modal visible={withdrawModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Withdraw Earnings</Text>
                <Text style={styles.modalSubtitle}>
                  Available Balance: ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Error banner if any */}
            {withdrawError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{withdrawError}</Text>
              </View>
            )}

            {/* Select Destination Account */}
            <Text style={styles.inputLabel}>Payout Destination</Text>
            <View style={styles.destinationList}>
              <TouchableOpacity
                style={[styles.destinationCard, selectedMethod === 'BANK' && styles.destinationCardActive]}
                onPress={() => setSelectedMethod('BANK')}
              >
                <Text style={styles.destEmoji}>🏦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destTitle}>Direct Deposit (Chase Checking)</Text>
                  <Text style={styles.destSub}>Account ending in 4192 • Free • 1-2 Days</Text>
                </View>
                <View style={[styles.destRadio, selectedMethod === 'BANK' && styles.destRadioActive]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.destinationCard, selectedMethod === 'PAYPAL' && styles.destinationCardActive]}
                onPress={() => setSelectedMethod('PAYPAL')}
              >
                <Text style={styles.destEmoji}>🅿️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destTitle}>PayPal Instant Transfer</Text>
                  <Text style={styles.destSub}>ruwansadeepa67@gmail.com • Instant</Text>
                </View>
                <View style={[styles.destRadio, selectedMethod === 'PAYPAL' && styles.destRadioActive]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.destinationCard, selectedMethod === 'CARD' && styles.destinationCardActive]}
                onPress={() => setSelectedMethod('CARD')}
              >
                <Text style={styles.destEmoji}>💳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destTitle}>Debit Card (Visa •••• 8821)</Text>
                  <Text style={styles.destSub}>Direct to card • Instant payout</Text>
                </View>
                <View style={[styles.destRadio, selectedMethod === 'CARD' && styles.destRadioActive]} />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Withdrawal Amount ($ USD)</Text>
            <TextInput
              style={styles.amountInput}
              value={withdrawAmount}
              onChangeText={(text) => {
                setWithdrawError(null);
                setWithdrawAmount(text);
              }}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            {/* Quick Amount Chips */}
            <View style={styles.quickChipsRow}>
              {[500, 1000, 2500].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickChip}
                  onPress={() => {
                    setWithdrawError(null);
                    setWithdrawAmount(Math.min(availableBalance, val).toString());
                  }}
                >
                  <Text style={styles.quickChipText}>${val.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickChip, styles.quickChipMax]}
                onPress={() => {
                  setWithdrawError(null);
                  setWithdrawAmount(availableBalance.toString());
                }}
              >
                <Text style={styles.quickChipTextMax}>Max (${availableBalance.toLocaleString()})</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  isProcessingWithdrawal && { opacity: 0.7 },
                ]}
                onPress={handleWithdraw}
                disabled={isProcessingWithdrawal}
              >
                {isProcessingWithdrawal ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 2,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#0F172A',
    lineHeight: 30,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  securityBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  // Hero Card - More More More Dark Green
  heroCard: {
    backgroundColor: '#052E16', // Deep forest dark green
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#14532D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#86EFAC',
    letterSpacing: 0.6,
  },
  readyBadge: {
    backgroundColor: '#14532D',
    borderWidth: 1,
    borderColor: '#166534',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  readyBadgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroHelperText: {
    fontSize: 12,
    color: '#A7F3D0',
    marginBottom: 16,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  withdrawBtn: {
    flex: 1.2,
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  accountsBtn: {
    flex: 1,
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#047857',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsBtnText: {
    color: '#ECFDF5',
    fontSize: 13,
    fontWeight: '600',
  },
  // Grid Metrics
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  gridValueDark: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
  },
  metricSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  // Info Banner
  infoBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  infoBannerBody: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18,
  },
  // Section Header
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // History List
  historyList: {
    gap: 10,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  historyCardWithdrawn: {
    backgroundColor: '#FAFAFA',
  },
  historyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  amountReleased: {
    color: '#16A34A',
  },
  amountEscrow: {
    color: '#2563EB',
  },
  amountWithdrawn: {
    color: '#DC2626',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeEscrow: {
    backgroundColor: '#EFF6FF',
  },
  badgeReleased: {
    backgroundColor: '#DCFCE7',
  },
  badgeWithdrawn: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextEscrow: {
    color: '#1D4ED8',
  },
  badgeTextReleased: {
    color: '#15803D',
  },
  badgeTextWithdrawn: {
    color: '#B91C1C',
  },
  // Toast
  toastBox: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modals General
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  modalSubtitleGray: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  // Linked Accounts Modal
  accountsScrollList: {
    gap: 10,
    marginBottom: 16,
  },
  linkedAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  linkedAccountCardDefault: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  linkedAccIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkedAccName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  linkedAccDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  linkedAccType: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  makeDefaultBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  makeDefaultBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  activePillCheck: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  activePillCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  accountActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editAccountBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  editAccountBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  crossDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossDeleteIcon: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  addAccountBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  addAccountBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  // Bank Details Form
  bankFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  bankFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankFormTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankFormCancelLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  formErrorBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 6,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeChipActive: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#15803D',
  },
  paymentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paymentTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  paymentTypeChipActive: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  paymentTypeIcon: {
    fontSize: 14,
  },
  paymentTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  paymentTypeChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  saveBankBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBankBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Dialog (Milestone Detail)
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dialogAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogAmountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  dialogAmountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  dialogDateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  escrowNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  escrowNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  escrowNoticeBody: {
    fontSize: 12,
    color: '#1D4ED8',
    lineHeight: 18,
    marginBottom: 12,
  },
  releaseNowBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  releaseNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  releasedNoticeBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  releasedNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  releasedNoticeBody: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    marginBottom: 12,
  },
  withdrawNowQuickBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawNowQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  withdrawnNoticeBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  withdrawnNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 4,
  },
  withdrawnNoticeBody: {
    fontSize: 12,
    color: '#991B1B',
  },
  dialogCloseBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogCloseBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  // Withdraw Modal Details
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  destinationList: {
    gap: 8,
    marginBottom: 16,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  destinationCardActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  destEmoji: {
    fontSize: 20,
  },
  destTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  destSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  destRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  destRadioActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  amountInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickChipMax: {
    backgroundColor: '#DCFCE7',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  quickChipTextMax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#16A34A',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
