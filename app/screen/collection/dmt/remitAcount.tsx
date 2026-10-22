import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteAccount, dmtAccountVarificationApiCall, dmtlogout, DmtTransactionInitiate, getAllAccountLink, newBankAccount } from '@/hooks/servies/dmtApi';
import { setDmtData, setNewAccount } from '@/redux/dmt/dmtSlice';
import TransactionModal from '@/components/modal/dmt/transfermMoneyForm';
import AddAccountModal from '@/components/modal/dmt/accountAddForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TransactionPinModal from '@/components/modal/dmt/transactionPinModal';


const RemitAccount = () => {
  const dispatch = useDispatch();
  const { allDmtData, getAccountlist } = useSelector((state: any) => state.dmt);
    
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [transactionPinModalVisible, setTransactionPinModalVisible] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Combined loading state for overlay
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Add null checks for nested data
  const remitterinfo = allDmtData?.data?.dmtProfileData || null;
  
  const fectAllAcount = async() => {
    setIsPageLoading(true);
    try {
      const res = await getAllAccountLink();
      if(res.status === "SUCCESS"){
        dispatch(setNewAccount(res.data?.dmtData))
      }else{
        Alert.alert(`${res.status}`, `${res?.message}`)
      }
    } catch  {
      Alert.alert('Error', 'Failed to fetch accounts');
    } finally {
      setIsPageLoading(false);
    }
  }

  useEffect(() => {
    fectAllAcount();
  }, [dispatch]);

  const handleBackbtn = () => {
    router.replace('/(tabs)');
  };

  const handleAddAccount = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleCloseTransactionModal = () => {
    setTransactionModalVisible(false);
    setSelectedAccount(null);
  };


  const handleAddAccountSubmit = async (data: any) => {
    setIsPageLoading(true);
    setLoadingMessage('Adding bank account...');
    try {
      const res = await newBankAccount(data,allDmtData);
      if(res.status === "SUCCESS"){
        Alert.alert(`${res.status}`, `${res.message}`);
        const response = await getAllAccountLink();
        dispatch(setNewAccount(response.data?.dmtData));
        handleCloseModal();
      } else {
        Alert.alert(`${res.status}`, `${res.message}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to add account');
    } finally {
      setIsPageLoading(false);
      setLoadingMessage('');
    }
  };

  const handleVerifyAccount = async(data:any) => {
    setIsPageLoading(true);
    setLoadingMessage('Verifying account...');
    setMenuVisible(null);
    try {
      setModalVisible(false);
      await dmtAccountVarificationApiCall(data);
      await fectAllAcount();
    } catch {
      Alert.alert('Error', 'Failed to verify account');
    } finally {
      setIsPageLoading(false);
      setLoadingMessage('');
    }
  }

  const handleTransactionInitiate = async (data: any) => {
    setIsPageLoading(true);
    setLoadingMessage('Processing transaction...');
    try { 
      const res = await DmtTransactionInitiate(data,selectedAccount);
      
      if(res?.status === "SUCCESS"){
        Alert.alert(`${res?.status}` , `${res?.message}`);
        setTransactionPinModalVisible(true)
        handleCloseTransactionModal();
        await fectAllAcount();
      } else {
        Alert.alert(`${res?.status}` , `${res?.message}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to process transaction. Please try again.');
    } finally {
      setIsPageLoading(false);
      setLoadingMessage('');
    }
  };


  const handleDeleteAccount = (accountId: string) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async() => {
            setIsPageLoading(true);
            setLoadingMessage('Deleting account...');
            try {
              await deleteAccount(accountId, dispatch);
              await fectAllAcount();
            } catch  {
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setIsPageLoading(false);
              setLoadingMessage('');
            }
          }
        }
      ]
    );
  };

  const handleSendMoney = (account: any) => {
    setSelectedAccount(account);
    setMenuVisible(null);
    setTransactionModalVisible(true);
  };

  const toggleMenu = (accountId: string) => {
    setMenuVisible(menuVisible === accountId ? null : accountId);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async() => {
            setIsPageLoading(true);
            setLoadingMessage('Logging out...');
            try {
              await dmtlogout();
              await AsyncStorage.removeItem('dmtData');
              dispatch(setDmtData(""));
              router.replace('/(tabs)');
            } catch {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsPageLoading(false);
              setLoadingMessage('');
            }
          }
        }
      ]
    );
  };


  // Render each bank account item
  const renderBankAccount = ({ item }: any) => {
    return (
      <View style={styles.bankCard}>
        <View style={styles.bankCardHeader}>
          <View style={styles.bankIconContainer}>
            <MaterialIcons name="account-balance" size={24} color="#4F1CA9" />
          </View>
          <View style={styles.bankInfo}>
            <View style={styles.bankNameRow}>
              <Text style={styles.bankCardName}>{item.bank_name || item.name}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.accountHolderName}>{item.name || item.accountHolderName}</Text>
            <Text style={styles.accountNumber}>A/C No: {item.accountNo || item.accno}</Text>
            <Text style={styles.ifscCode}>IFSC: {item.ifsc}</Text>
          </View>
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => toggleMenu(item.bene_id || item.id)} style={styles.menuButton}>
              <MaterialIcons name="more-vert" size={24} color="#666" />
            </TouchableOpacity>
            
            {menuVisible === (item.bene_id || item.id) && (
              <View style={styles.menuDropdown}>
                {/* Verify Button - Show only if account is NOT verified */}
                {(item.verified === "0") && (
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={()=> handleVerifyAccount(item)}
                  >
                    <MaterialIcons name="verified" size={20} color="#4CAF50" />
                    <Text style={styles.menuItemText}>Verify Account</Text>
                  </TouchableOpacity>
                )}
                
                {/* Send Money Button */}
                <TouchableOpacity 
                  style={[styles.menuItem, (item.verified === "0") && styles.disabledMenuItem]}
                  onPress={() => item.verified === '0' ? Alert.alert('Verification Required', 'Please verify this account before sending money') : handleSendMoney(item)}
                >
                  <MaterialIcons name="send" size={20} color={item.verified === '0' ? "#999" : "#4F1CA9"} />
                  <Text style={[
                    styles.menuItemText,
                    (item.verified === "0") && styles.disabledMenuItemText
                  ]}>Send Money</Text>
                </TouchableOpacity>
                
                {/* Delete Button */}
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => handleDeleteAccount(item.bene_id || item.id)}
                >
                  <MaterialIcons name="delete" size={20} color="#FF5252" />
                  <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // // Initial loading screen
  // if (isInitialLoading) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <ActivityIndicator size="large" color="#4F1CA9" />
  //       <Text style={styles.loaderText}>Loading accounts...</Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackbtn} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remitter Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
          >
            <MaterialIcons name="logout" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Remitter Info Card */}
        {remitterinfo ? (
          <View style={styles.card}>
            {/* Header with Avatar */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  <Ionicons name="people-circle-outline" size={65} color="white" />
                </Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.fullName}>
                  {remitterinfo.fname || ''} {remitterinfo.lname || ''}
                </Text>
                <View style={styles.badgeContainer}>
                  <MaterialIcons name="verified" size={16} color="#4F1CA9" />
                  <Text style={styles.verifiedText}>Verified Remitter</Text>
                </View>
              </View>
            </View>

            {/* Remitter Details */}
            <View style={styles.detailsContainer}>
              {/* Mobile Number */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="phone" size={20} color="#4F1CA9" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Mobile Number</Text>
                  <Text style={styles.detailValue}>{remitterinfo.mobile || 'N/A'}</Text>
                </View>
              </View>

              {/* Available Limit */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="account-balance-wallet" size={20} color="#4F1CA9" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Available Limit</Text>
                  <Text style={styles.detailValue}>₹{remitterinfo.remainingLimit?.toLocaleString() || '0'}</Text>
                </View>
              </View>

              {/* Remitter Status */}
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="badge" size={20} color="#4F1CA9" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Remitter Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{getAccountlist?.length || 0}</Text>
                <Text style={styles.statLabel}>Linked Banks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>₹{remitterinfo.limit?.toLocaleString() || '0'}</Text>
                <Text style={styles.statLabel}>Total Limit</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>₹{remitterinfo.remainingLimit?.toLocaleString() || '0'}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </View>
        ) : (
          // No Data Available
          <View style={styles.noDataContainer}>
            <MaterialIcons name="error-outline" size={48} color="#999" />
            <Text style={styles.noDataText}>No remitter information available</Text>
          </View>
        )}

        {/* Account Linked User Section */}
        <View style={styles.banksSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="account-balance" size={24} color="#4F1CA9" />
              <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            </View>
            <TouchableOpacity 
              onPress={handleAddAccount} 
              style={styles.addBankButton}
            >
              <MaterialIcons name="add" size={18} color="#FFF" />
              <Text style={styles.addBankButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {getAccountlist && getAccountlist.length > 0 ? (
            <FlatList
              data={getAccountlist}
              renderItem={renderBankAccount}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bankListContainer}
            />
          ) : (
            <View style={styles.noBanksContainer}>
              <MaterialIcons name="account-balance" size={48} color="#E0E0E0" />
              <Text style={styles.noBanksText}>No bank accounts linked</Text>
              <Text style={styles.noBanksSubText}>Tap the Add New button to link a bank account</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Global Loading Overlay */}
      {isPageLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4F1CA9" />
            <Text style={styles.loadingOverlayText}>{loadingMessage}</Text>
          </View>
        </View>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSubmit={handleAddAccountSubmit}
      />

      {/* Transaction Modal */}
      <TransactionModal
        visible={transactionModalVisible}
        onClose={handleCloseTransactionModal}
        onSubmit={handleTransactionInitiate}
        selectedAccount={selectedAccount}
      />
      <TransactionPinModal
          visible={transactionPinModalVisible}
           onClose={() => {
               setTransactionPinModalVisible(false);
            }}
       />
    </View>
  )
}

export default RemitAccount

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Initial loader styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4F1CA9',
    fontWeight: '500',
  },
  // Global loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#4F1CA9',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 40,
    alignItems: 'center',
  },
  content: {
    flex:1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#4F1CA9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#4F1CA9',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameContainer: {
    flex: 1,
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 13,
    color: '#4F1CA9',
    marginLeft: 4,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 15,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 12,
    textAlign: 'center',
  },
  banksSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    marginBottom:60,
    padding: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F1CA9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#4F1CA9',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 90,
    justifyContent: 'center',
  },
  addBankButtonText: {
    fontSize: 13,
    color: '#FFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  bankListContainer: {
    paddingBottom: 10,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    position:'relative',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  bankCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#4F1CA9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  accountHolderName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 13,
    color: '#999',
    marginBottom: 2,
  },
  ifscCode: {
    fontSize: 12,
    color: '#999',
  },
  menuContainer: {
    position: 'relative',
    minWidth: 40,
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  menuDropdown: {
    position: 'absolute',
    top: -40,
    right: 50,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 11111,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteMenuItemText: {
    color: '#FF5252',
  },
  noBanksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noBanksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  noBanksSubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
  },
  verifiedBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledMenuItemText: {
    color: '#999',
  }
});